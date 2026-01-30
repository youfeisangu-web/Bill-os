import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import iconv from 'iconv-lite';
import Papa from 'papaparse';
import stringSimilarity from 'string-similarity';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';
import type { ReconcileResult, ReconcileStatus } from '@/types/reconcile';

type ColumnMap = { dateCol: number; amountCol: number; nameCol: number };

/** 名義・フリガナの比較用に正規化（スペース・括弧除去、半角英数はそのまま） */
function normalizeNameForMatch(s: string): string {
    return s.replace(/[\s　]|[（）()]|カ\)/g, '').trim();
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

        // 2. データベースから全ての入居者データを取得
        const tenants = await prisma.tenant.findMany();

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
            let matchData: { tenantId: string; name: string; amount: number } | null = null;

            // A. 口座振替チェック
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
            // B. 個人消込（取引先マッチング）
            else {
                const cleanName = normalizeNameForMatch(rawName);
                // まず金額が一致する取引先を候補に
                let candidates = tenants.filter((t: { amount: number }) => t.amount === amount);
                if (candidates.length > 0) {
                    const targetNames = candidates.map((c: { nameKana: string }) => normalizeNameForMatch(c.nameKana));
                    const match = stringSimilarity.findBestMatch(cleanName, targetNames);
                    const rating = match.bestMatch.rating;
                    const idx = match.bestMatchIndex;
                    if (rating >= 0.5) {
                        status = '完了';
                        message = `消込成功: ${candidates[idx].name}`;
                        matchData = { tenantId: candidates[idx].id, name: candidates[idx].name, amount: candidates[idx].amount };
                    } else if (rating >= 0.35) {
                        status = '確認';
                        message = `候補: ${candidates[idx].name}（名前の表記が異なります）`;
                        matchData = { tenantId: candidates[idx].id, name: candidates[idx].name, amount: candidates[idx].amount };
                    } else {
                        status = '確認';
                        message = `金額一致の取引先あり・名前不一致`;
                    }
                } else {
                    // 金額一致なし → 名前だけで検索（取引先が1人なら採用）
                    if (tenants.length > 0) {
                        const targetNames = tenants.map((t: { nameKana: string }) => normalizeNameForMatch(t.nameKana));
                        const match = stringSimilarity.findBestMatch(cleanName, targetNames);
                        if (match.bestMatch.rating >= 0.65) {
                            const idx = match.bestMatchIndex;
                            status = '確認';
                            message = `候補: ${tenants[idx].name}（金額が異なります ¥${tenants[idx].amount.toLocaleString()}）`;
                            matchData = { tenantId: tenants[idx].id, name: tenants[idx].name, amount: tenants[idx].amount };
                        } else {
                            message = `この金額(¥${amount.toLocaleString()})の取引先が登録されていません`;
                        }
                    } else {
                        message = '取引先が1件も登録されていません。ダッシュボードで取引先を登録してください';
                    }
                }
            }

            results.push({
                date: dateVal,
                amount,
                rawName,
                status,
                message,
                tenantId: matchData?.tenantId || null,
            });
        }

        // 6. 結果を画面に返す（取引先件数で原因が分かるように）
        return NextResponse.json({
            success: true,
            data: results,
            meta: { tenantCount: tenants.length },
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 });
    }
}