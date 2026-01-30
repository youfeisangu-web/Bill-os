import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import iconv from 'iconv-lite';
import Papa from 'papaparse';
import stringSimilarity from 'string-similarity';
import { prisma } from '@/lib/prisma';
import type { ReconcileResult, ReconcileStatus } from '@/types/reconcile';

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

        // 5. あの「最強ロジック」を実行！
        // CSV行数の上限（DoS攻撃対策）
        const MAX_ROWS = 10000;
        if (bankData.length > MAX_ROWS) {
            return NextResponse.json({ error: `CSVファイルの行数が多すぎます（${MAX_ROWS}行以下）` }, { status: 400 });
        }

        for (const row of bankData) {
            // 行の長さチェック
            if (!Array.isArray(row) || row.length < 4) continue;

            const amount = parseInt(row[2]);
            const rawName = row[3]?.trim() || '';

            // 名前の長さ制限
            if (rawName.length > 200) continue;

            if (!amount || !rawName) continue;

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
            // B. 個人消込（AIマッチング）
            else {
                // 金額が一致する入居者を候補として抽出
                const candidates = tenants.filter((tenant: { amount: number }) => tenant.amount === amount);
                if (candidates.length > 0) {
                    // 名前をクリーンアップ（カタカナ、スペース、括弧を除去）
                    const cleanName = rawName.replace(/カ\）|[\s　]|[（）()]/g, "");
                    // 候補のフリガナを取得（nameKanaを使用）
                    const targetNames = candidates.map((c: { nameKana: string }) => c.nameKana);
                    const match = stringSimilarity.findBestMatch(cleanName, targetNames);
                    
                    if (match.bestMatch.rating >= 0.6) {
                        status = '完了';
                        message = `消込成功: ${candidates[match.bestMatchIndex].name}`;
                        matchData = {
                            tenantId: candidates[match.bestMatchIndex].id,
                            name: candidates[match.bestMatchIndex].name,
                            amount: candidates[match.bestMatchIndex].amount,
                        };
                    } else {
                        status = '確認';
                        message = `候補あり・名前不一致`;
                    }
                }
            }

            // 結果をリストに追加
            results.push({
                date: row[0],
                amount,
                rawName,
                status,
                message,
                tenantId: matchData?.tenantId || null, // マッチした場合のみtenantIdを含める
            });
        }

        // 6. 結果を画面に返す
        return NextResponse.json({ success: true, data: results });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 });
    }
}