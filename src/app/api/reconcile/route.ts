import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import iconv from 'iconv-lite';
import jaconv from 'jaconv';
import Papa from 'papaparse';
import stringSimilarity from 'string-similarity';
import { prisma } from '@/lib/prisma';
import { generateText, generateContentWithImage } from '@/lib/gemini';
import type { ReconcileResult, ReconcileStatus } from '@/types/reconcile';

type ColumnMap = { dateCol: number; amountCol: number; nameCol: number };

/** 名義・フリガナの比較用に正規化（スペース・括弧除去、半角カナ→全角） */
function normalizeNameForMatch(s: string): string {
    const trimmed = s.replace(/[\s　]|[（）()]|カ\)/g, '').trim();
    try {
        return jaconv.toZenKana(trimmed);
    } catch {
        return trimmed;
    }
}

/** 漢字が含まれるか（CJK統合漢字の範囲） */
function hasKanji(s: string): boolean {
    return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(s);
}

/** 名義リストを入金照合用カナに揃える（漢字ならGeminiでカタカナ化） */
async function getNamesForMatch(
    names: string[],
    geminiKey: string | undefined,
): Promise<string[]> {
    const normalized = names.map((n) => normalizeNameForMatch(n));
    const needConversion = names.filter((n) => hasKanji(n));
    if (needConversion.length === 0 || !geminiKey) return normalized;

    try {
        const prompt = `以下の日本語の名前を、全角カタカナに変換してください。会社名・人名です。変換結果だけを、1行に1件で、この順番のまま出力してください。\n\n${needConversion.join('\n')}`;
        const content = (await generateText(prompt, { maxTokens: 500 })).trim();
        const lines = content.split(/\n/).map((l) => normalizeNameForMatch(l.trim()));
        let lineIdx = 0;
        return names.map((n, i) => {
            if (hasKanji(n)) return lines[lineIdx++] ?? normalized[i];
            return normalized[i];
        });
    } catch (e) {
        console.warn('Gemini katakana conversion failed, using original:', e);
        return normalized;
    }
}

const agencies = [
    { name: 'リコーリース', checkString: 'ﾘｺ-ﾘ-ｽ', expectedAmount: 850000 },
];

// ファイルサイズの上限（20MB、画像/PDF対応のため拡張）
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 20;

/** 1ファイルを入金明細データ（[date, '', amount, name]）に変換 */
async function processFileToBankData(
    file: File,
    apiKey: string | undefined,
): Promise<string[][]> {
    const name = (file.name || '').toLowerCase();
    const type = (file.type || '').toLowerCase();
    const isCsv = name.endsWith('.csv') || type === 'text/csv' || type === 'application/vnd.ms-excel' || type === 'application/csv';
    const isImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(type) ||
                    name.match(/\.(jpg|jpeg|png|gif|webp)$/);
    const isPdf = type === 'application/pdf' || name.endsWith('.pdf');

    if (isCsv) {
        const buffer = Buffer.from(await file.arrayBuffer());
        let text: string;
        if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
            text = buffer.toString('utf-8');
        } else {
            text = buffer.toString('utf-8');
            if (text.includes('\uFFFD')) {
                text = iconv.decode(buffer, 'Shift_JIS');
            }
        }
        const parsed = Papa.parse(text, { header: false, skipEmptyLines: true });
        const rawRows = parsed.data as string[][];

        let colMap: ColumnMap = { dateCol: 0, amountCol: 2, nameCol: 3 };
        if (apiKey && rawRows.length > 0 && rawRows.some((r) => Array.isArray(r) && r.length >= 3)) {
            try {
                const sampleRows = rawRows.slice(0, 5).map((r) => (Array.isArray(r) ? r : []));
                const prompt = `以下の銀行入金CSVのサンプル行です。列は0始まりのインデックスで、「取引日」「入金額（数値）」「入金名義（振込人名）」がそれぞれ何列目か判定し、JSONのみで返してください。形式: {"dateCol":0,"amountCol":2,"nameCol":3}\n\nサンプル:\n${JSON.stringify(sampleRows)}`;
                const content = (await generateText(prompt, { maxTokens: 100 })).trim();
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsedMap = JSON.parse(jsonMatch[0]) as ColumnMap;
                    if (
                        typeof parsedMap.dateCol === 'number' &&
                        typeof parsedMap.amountCol === 'number' &&
                        typeof parsedMap.nameCol === 'number' &&
                        parsedMap.dateCol >= 0 &&
                        parsedMap.amountCol >= 0 &&
                        parsedMap.nameCol >= 0
                    ) {
                        colMap = parsedMap;
                    }
                }
            } catch {
                // デフォルトのまま
            }
        }

        return rawRows
            .filter((row): row is string[] => Array.isArray(row) && row.length > Math.max(colMap.dateCol, colMap.amountCol, colMap.nameCol))
            .map((row) => [row[colMap.dateCol]?.trim() || '', '', String(row[colMap.amountCol] ?? '').replace(/[,，]/g, ''), row[colMap.nameCol]?.trim() || '']);
    }

    if (isImage || isPdf) {
        if (!apiKey) throw new Error('Gemini APIキーが設定されていません。画像/PDFの読み込みにはAPIキーが必要です。');
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Data = buffer.toString('base64');
        const mimeType = isPdf ? 'application/pdf' : (file.type || 'image/jpeg');
        const prompt = `この画像は銀行の入金明細（通帳の写し、入金通知書、振込明細など）です。以下の情報をすべて抽出し、JSON形式のみで返してください（Markdown記法は不要）。

各入金明細を配列として返してください。各要素は以下の形式です：
{
  "date": "取引日（YYYY-MM-DD形式、またはYYYY/MM/DD形式）",
  "amount": 入金額（数値のみ、カンマは除去）,
  "name": "入金名義・振込人名（全角カタカナ、漢字、アルファベットなどそのまま）"
}

例:
[
  { "date": "2025-02-01", "amount": 100000, "name": "ヤマダタロウ" },
  { "date": "2025-02-03", "amount": 50000, "name": "株式会社サンプル" }
]

複数の入金明細がある場合は、すべて抽出してください。日付が不明な場合は現在の日付を使用してください。`;

        const responseText = await generateContentWithImage(
            prompt,
            base64Data,
            mimeType,
            { maxTokens: 2000, temperature: 0.1 }
        );
        if (!responseText) throw new Error('AIからの応答がありませんでした');

        let jsonText = responseText.trim();
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.split('\n').filter((line) => !line.startsWith('```')).join('\n').trim();
        }
        const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('AIの応答を解析できませんでした。入金明細が抽出できませんでした。');

        const extractedData = JSON.parse(jsonMatch[0]) as Array<{ date: string; amount: number; name: string }>;
        return extractedData.map((item) => [item.date || '', '', String(item.amount || 0), item.name || '']);
    }

    throw new Error('対応していないファイル形式です');
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const formData = await req.formData();
        const rawFiles = formData.getAll('file');
        const files = (Array.isArray(rawFiles) ? rawFiles : rawFiles ? [rawFiles] : []).filter(
            (f): f is File => f instanceof File
        );

        if (files.length === 0) {
            return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 });
        }
        if (files.length > MAX_FILES) {
            return NextResponse.json({ error: `一度に${MAX_FILES}件までです（${files.length}件選択されています）` }, { status: 400 });
        }

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json({ error: `「${file.name}」が大きすぎます（20MB以下）` }, { status: 400 });
            }
            const name = (file.name || '').toLowerCase();
            const type = (file.type || '').toLowerCase();
            const isCsv = name.endsWith('.csv') || type === 'text/csv' || type === 'application/vnd.ms-excel' || type === 'application/csv';
            const isImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(type) || name.match(/\.(jpg|jpeg|png|gif|webp)$/);
            const isPdf = type === 'application/pdf' || name.endsWith('.pdf');
            if (!isCsv && !isImage && !isPdf) {
                return NextResponse.json({ error: `「${file.name}」はCSV、画像、PDF以外です` }, { status: 400 });
            }
        }

        const invoices = await prisma.invoice.findMany({
            where: { userId, status: { in: ['未払い', '部分払い'] } },
            select: { id: true, totalAmount: true, issueDate: true, client: { select: { name: true } } },
            orderBy: { issueDate: 'asc' },
        });
        const clientNames = invoices.map((inv) => inv.client.name);
        const invoiceMatchNames = await getNamesForMatch(clientNames, process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        let bankData: string[][] = [];

        for (const file of files) {
            try {
                const rows = await processFileToBankData(file, apiKey);
                bankData = bankData.concat(rows);
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : '読み込みに失敗しました';
                return NextResponse.json({ error: `「${file.name}」: ${msg}` }, { status: 500 });
            }
        }

        const results: ReconcileResult[] = [];
        const allocatedInvoiceIds = new Set<string>();

        const MAX_ROWS = 10000;
        if (bankData.length > MAX_ROWS) {
            return NextResponse.json({ error: `データの行数が多すぎます（${MAX_ROWS}行以下）` }, { status: 400 });
        }

        const colMap: ColumnMap = { dateCol: 0, amountCol: 2, nameCol: 3 };

        for (const row of bankData) {
            if (!Array.isArray(row)) continue;
            const maxCol = Math.max(colMap.dateCol, colMap.amountCol, colMap.nameCol);
            if (row.length <= maxCol) continue;

            const dateVal = row[colMap.dateCol]?.trim() || '';
            const amount = parseInt(String(row[colMap.amountCol]).replace(/[,，]/g, ''), 10);
            const rawName = (row[colMap.nameCol]?.trim() || '').slice(0, 200);

            // 名前の長さ制限
            if (rawName.length > 200) continue;

            if (!dateVal || !rawName || !amount || isNaN(amount)) continue;

            let status: ReconcileStatus = '未完了';
            let message = '一致なし';
            let matchedInvoiceId: string | null = null;
            let matchedInvoiceNumber: string | null = null;
            let matchedClientName: string | null = null;

            // A. 口座振替チェック（特例）
            const agencyMatch = agencies.find(a => rawName.includes(a.checkString));
            if (agencyMatch) {
                if (amount === agencyMatch.expectedAmount) {
                    status = '完了';
                    message = `口座振替OK (${agencyMatch.name})`;
                } else {
                    status = 'エラー';
                    message = `金額不一致 (予定:${agencyMatch.expectedAmount})`;
                }
            }
            // B. 請求書マッチング（金額は完全一致のみ・名前はあってそうな候補を表示・同じ会社同額はFIFO）
            else {
                const cleanName = normalizeNameForMatch(rawName);
                const candidates = invoices
                    .filter((inv) => inv.totalAmount === amount && !allocatedInvoiceIds.has(inv.id))
                    .slice();
                if (candidates.length > 0) {
                    const candidateMatchNames = candidates.map((c) => {
                        const idx = invoices.findIndex((inv) => inv.id === c.id);
                        return idx >= 0 ? invoiceMatchNames[idx] : normalizeNameForMatch(c.client.name);
                    });
                    const match = stringSimilarity.findBestMatch(cleanName, candidateMatchNames);
                    const rating = match.bestMatch.rating;
                    const idx = match.bestMatchIndex;
                    const inv = candidates[idx];
                    // 金額は完全一致の請求書のうち、名前が一番あってそうなものを常に表示
                    matchedInvoiceId = inv.id;
                    matchedInvoiceNumber = inv.id;
                    matchedClientName = inv.client.name;
                    allocatedInvoiceIds.add(inv.id);
                    if (rating >= 0.5) {
                        status = '完了';
                        message = `消込成功: ${inv.client.name}（請求書）`;
                    } else if (rating >= 0.35) {
                        status = '確認';
                        message = `候補: ${inv.client.name}（請求書・名前の表記が異なります）`;
                    } else {
                        status = '確認';
                        message = `候補: ${inv.client.name}（金額一致・名前が異なります）`;
                    }
                } else {
                    // 金額が完全に同じ請求書がない → 候補は出さない（金額は完全一致のみ）
                    if (invoices.length > 0) {
                        message = `この金額(¥${amount.toLocaleString()})の未払い請求書がありません`;
                    } else {
                        message = '未払い・部分払いの請求書が1件もありません';
                    }
                }
            }

            results.push({
                date: dateVal,
                amount,
                rawName,
                status,
                message,
                invoiceId: matchedInvoiceId,
                invoiceNumber: matchedInvoiceNumber,
                clientName: matchedClientName,
                tenantId: null,
            });
        }

        return NextResponse.json({
            success: true,
            data: results,
            meta: { unpaidInvoiceCount: invoices.length },
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 });
    }
}