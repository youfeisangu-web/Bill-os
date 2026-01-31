import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import iconv from 'iconv-lite';
import jaconv from 'jaconv';
import Papa from 'papaparse';
import stringSimilarity from 'string-similarity';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';
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

/** 名義リストを入金照合用カナに揃える（漢字ならOpenAIでカタカナ化） */
async function getNamesForMatch(
    names: string[],
    openaiKey: string | undefined,
): Promise<string[]> {
    const normalized = names.map((n) => normalizeNameForMatch(n));
    const needConversion = names.filter((n) => hasKanji(n));
    if (needConversion.length === 0 || !openaiKey) return normalized;

    try {
        const res = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: `以下の日本語の名前を、全角カタカナに変換してください。会社名・人名です。変換結果だけを、1行に1件で、この順番のまま出力してください。\n\n${needConversion.join('\n')}`,
                },
            ],
            max_tokens: 500,
        });
        const content = res.choices[0]?.message?.content?.trim() || '';
        const lines = content.split(/\n/).map((l) => normalizeNameForMatch(l.trim()));
        let lineIdx = 0;
        return names.map((n, i) => {
            if (hasKanji(n)) return lines[lineIdx++] ?? normalized[i];
            return normalized[i];
        });
    } catch (e) {
        console.warn('OpenAI katakana conversion failed, using original:', e);
        return normalized;
    }
}

const agencies = [
    { name: 'リコーリース', checkString: 'ﾘｺ-ﾘ-ｽ', expectedAmount: 850000 },
];

// ファイルサイズの上限（10MB）
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
    try {
        // 認証チェック
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        // 1. 画面から送られてきたファイルを受け取る
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 });
        }

        // ファイルサイズチェック
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'ファイルサイズが大きすぎます（10MB以下）' }, { status: 400 });
        }

        // ファイルタイプチェック（拡張子 .csv または CSV 系 MIME）
        const name = (file.name || '').toLowerCase();
        const type = (file.type || '').toLowerCase();
        const isCsv = name.endsWith('.csv') || type === 'text/csv' || type === 'application/vnd.ms-excel' || type === 'application/csv';
        if (!isCsv) {
            return NextResponse.json({ error: 'CSVファイル（.csv）のみアップロード可能です' }, { status: 400 });
        }

        // 2. 未払い・部分払いの請求書を取得（取引先名で照合・発行日でFIFO）
        const invoices = await prisma.invoice.findMany({
            where: { userId, status: { in: ['未払い', '部分払い'] } },
            select: { id: true, totalAmount: true, issueDate: true, client: { select: { name: true } } },
            orderBy: { issueDate: 'asc' },
        });
        const clientNames = invoices.map((inv) => inv.client.name);
        const invoiceMatchNames = await getNamesForMatch(clientNames, process.env.OPENAI_API_KEY);

        // 3. ファイルの中身を読み込む（UTF-8 BOM / UTF-8 / Shift_JIS 対応）
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

        // 4. CSVをパース
        const parsed = Papa.parse(text, { header: false, skipEmptyLines: true });
        const bankData = parsed.data as string[][];

        const results: ReconcileResult[] = [];
        const allocatedInvoiceIds = new Set<string>();

        // 5. 列のマッピング（OpenAIで自動検出 or デフォルト）
        const MAX_ROWS = 10000;
        if (bankData.length > MAX_ROWS) {
            return NextResponse.json({ error: `CSVファイルの行数が多すぎます（${MAX_ROWS}行以下）` }, { status: 400 });
        }

        let colMap: ColumnMap = { dateCol: 0, amountCol: 2, nameCol: 3 };
        const apiKey = process.env.OPENAI_API_KEY;
        const sampleRows = bankData.slice(0, 5).map((r) => (Array.isArray(r) ? r : []));
        if (apiKey && sampleRows.length > 0 && sampleRows.some((r) => r.length >= 3)) {
            try {
                const res = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'user',
                            content: `以下の銀行入金CSVのサンプル行です。列は0始まりのインデックスで、「取引日」「入金額（数値）」「入金名義（振込人名）」がそれぞれ何列目か判定し、JSONのみで返してください。形式: {"dateCol":0,"amountCol":2,"nameCol":3}\n\nサンプル:\n${JSON.stringify(sampleRows)}`,
                        },
                    ],
                    max_tokens: 100,
                });
                const content = res.choices[0]?.message?.content?.trim() || '';
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]) as ColumnMap;
                    if (
                        typeof parsed.dateCol === 'number' &&
                        typeof parsed.amountCol === 'number' &&
                        typeof parsed.nameCol === 'number' &&
                        parsed.dateCol >= 0 &&
                        parsed.amountCol >= 0 &&
                        parsed.nameCol >= 0
                    ) {
                        colMap = parsed;
                    }
                }
            } catch (e) {
                console.warn('OpenAI column detection failed, using default:', e);
            }
        }

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