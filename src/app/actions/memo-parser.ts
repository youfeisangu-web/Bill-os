"use server";

import { auth } from "@clerk/nextjs/server";
import { generateText } from "@/lib/gemini";

export type MemoParseResult = {
  success: boolean;
  data?: {
    clientName: string;
    clientEmail?: string;
    clientAddress?: string;
    issueDate?: string; // YYYY-MM-DD
    dueDate?: string; // YYYY-MM-DD (請求書用)
    validUntil?: string; // YYYY-MM-DD (見積書用)
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
    note?: string;
  };
  message?: string;
};

/**
 * メモテキストから請求書データを解析する
 * 話し言葉や自由な形式のテキストを解析して構造化データに変換
 */
export async function parseMemoToInvoice(memoText: string): Promise<MemoParseResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "認証が必要です" };
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return { success: false, message: "Gemini APIキーが設定されていません" };
    }

    if (!memoText || memoText.trim().length === 0) {
      return { success: false, message: "メモテキストが入力されていません" };
    }

    const prompt = `以下のメモテキストから請求書の情報を抽出してください。話し言葉や自由な形式でも構いません。JSON形式のみで返してください（Markdown記法は不要）。

メモテキスト:
${memoText}

以下の形式でJSONを返してください:
{
  "clientName": "取引先名（会社名・個人名）",
  "clientEmail": "メールアドレス（あれば）",
  "clientAddress": "住所（あれば）",
  "issueDate": "発行日（YYYY-MM-DD形式、なければ今日の日付）",
  "dueDate": "支払期限（YYYY-MM-DD形式、なければ翌月末）",
  "items": [
    {
      "name": "項目名",
      "quantity": 数量（数値）,
      "unitPrice": 単価（数値、カンマは除去）
    }
  ],
  "note": "備考・メモ（あれば）"
}

例:
メモ: "株式会社ABC、システム開発費10万円、2025年2月15日発行、支払期限3月末"
→ {
  "clientName": "株式会社ABC",
  "issueDate": "2025-02-15",
  "dueDate": "2025-03-31",
  "items": [{"name": "システム開発費", "quantity": 1, "unitPrice": 100000}]
}

メモ: "山田さんに、ホームページ制作50,000円と、SEO対策30,000円、合計8万円で請求して"
→ {
  "clientName": "山田",
  "items": [
    {"name": "ホームページ制作", "quantity": 1, "unitPrice": 50000},
    {"name": "SEO対策", "quantity": 1, "unitPrice": 30000}
  ]
}

日付が不明な場合は現在の日付を使用してください。金額は数値のみで返してください（カンマや「円」は除去）。`;

    const responseText = await generateText(prompt, { maxTokens: 2000 });

    if (!responseText) {
      return { success: false, message: "AIからの応答がありませんでした" };
    }

    // JSONを抽出
    let jsonText = responseText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .split("\n")
        .filter((line) => !line.startsWith("```"))
        .join("\n")
        .trim();
    }
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, message: "AIの応答を解析できませんでした。もう一度お試しください。" };
    }

    const parsed = JSON.parse(jsonMatch[0]) as any;

    // バリデーションと正規化
    if (!parsed.clientName || !parsed.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return { success: false, message: "取引先名と項目が必須です。メモに含まれているか確認してください。" };
    }

    // 日付のデフォルト値設定
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    const nextMonthEndStr = `${nextMonthEnd.getFullYear()}-${String(nextMonthEnd.getMonth() + 1).padStart(2, "0")}-${String(nextMonthEnd.getDate()).padStart(2, "0")}`;

    const result: MemoParseResult["data"] = {
      clientName: String(parsed.clientName || "").trim(),
      clientEmail: parsed.clientEmail ? String(parsed.clientEmail).trim() : undefined,
      clientAddress: parsed.clientAddress ? String(parsed.clientAddress).trim() : undefined,
      issueDate: parsed.issueDate || todayStr,
      dueDate: parsed.dueDate || nextMonthEndStr,
      items: parsed.items.map((item: any) => ({
        name: String(item.name || "").trim(),
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(String(item.unitPrice || 0).replace(/[,，円]/g, "")) || 0,
      })),
      note: parsed.note ? String(parsed.note).trim() : undefined,
    };

    return { success: true, data: result };
  } catch (error: any) {
    const errorMessage = error?.message || "メモの解析に失敗しました";
    return { success: false, message: errorMessage };
  }
}

/**
 * メモテキストから経費データを解析する
 */
export type ExpenseMemoParseResult = {
  success: boolean;
  data?: {
    title: string;
    amount: number;
    date: string; // YYYY-MM-DD
    category: string;
  };
  message?: string;
};

export async function parseMemoToExpense(memoText: string): Promise<ExpenseMemoParseResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, message: "認証が必要です" };

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return { success: false, message: "Gemini APIキーが設定されていません" };

    if (!memoText || memoText.trim().length === 0) {
      return { success: false, message: "メモを入力してください" };
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const prompt = `以下のメモから経費情報を抽出してください。JSON形式のみで返してください（Markdown不要）。
カテゴリは必ず次の中から選んでください: 通信費, 外注費, 消耗品, 旅費交通費, 地代家賃, 広告宣伝費, その他
今日の日付: ${todayStr}

メモ:
${memoText}

形式:
{"title": "件名", "amount": 金額（数値）, "date": "YYYY-MM-DD", "category": "カテゴリ"}

例:
"昨日コンビニで500円のお菓子" → {"title": "コンビニ（お菓子）", "amount": 500, "date": "${todayStr}", "category": "消耗品"}
"電車代1200円" → {"title": "電車代", "amount": 1200, "date": "${todayStr}", "category": "旅費交通費"}
"AWS 3月分 15000円" → {"title": "AWS利用料", "amount": 15000, "date": "${todayStr}", "category": "通信費"}`;

    const responseText = await generateText(prompt, { maxTokens: 300 });
    if (!responseText) return { success: false, message: "AIからの応答がありませんでした" };

    let jsonText = responseText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.split("\n").filter((l) => !l.startsWith("```")).join("\n").trim();
    }
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { success: false, message: "AIの応答を解析できませんでした" };

    const parsed = JSON.parse(jsonMatch[0]) as any;
    if (!parsed.title || !parsed.amount) {
      return { success: false, message: "件名と金額が読み取れませんでした。もう少し詳しく書いてみてください。" };
    }

    return {
      success: true,
      data: {
        title: String(parsed.title).trim(),
        amount: Number(String(parsed.amount).replace(/[,，円]/g, "")),
        date: parsed.date || todayStr,
        category: parsed.category || "その他",
      },
    };
  } catch (error: any) {
    return { success: false, message: error?.message || "メモの解析に失敗しました" };
  }
}

/**
 * メモテキストから見積書データを解析する
 */
export async function parseMemoToQuote(memoText: string): Promise<MemoParseResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "認証が必要です" };
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return { success: false, message: "Gemini APIキーが設定されていません" };
    }

    if (!memoText || memoText.trim().length === 0) {
      return { success: false, message: "メモテキストが入力されていません" };
    }

    const prompt = `以下のメモテキストから見積書の情報を抽出してください。話し言葉や自由な形式でも構いません。JSON形式のみで返してください（Markdown記法は不要）。

メモテキスト:
${memoText}

以下の形式でJSONを返してください:
{
  "clientName": "取引先名（会社名・個人名）",
  "clientEmail": "メールアドレス（あれば）",
  "clientAddress": "住所（あれば）",
  "issueDate": "発行日（YYYY-MM-DD形式、なければ今日の日付）",
  "validUntil": "有効期限（YYYY-MM-DD形式、なければ翌月末）",
  "items": [
    {
      "name": "項目名",
      "quantity": 数量（数値）,
      "unitPrice": 単価（数値、カンマは除去）
    }
  ],
  "note": "備考・メモ（あれば）"
}

例:
メモ: "株式会社XYZに、ウェブサイト制作見積もり、50万円で提案して"
→ {
  "clientName": "株式会社XYZ",
  "validUntil": "2025-03-31",
  "items": [{"name": "ウェブサイト制作", "quantity": 1, "unitPrice": 500000}]
}

メモ: "田中さん、アプリ開発の見積もり、開発費100万、保守費月5万、3ヶ月分"
→ {
  "clientName": "田中",
  "items": [
    {"name": "アプリ開発", "quantity": 1, "unitPrice": 1000000},
    {"name": "保守費", "quantity": 3, "unitPrice": 50000}
  ]
}

日付が不明な場合は現在の日付を使用してください。金額は数値のみで返してください（カンマや「円」は除去）。`;

    const responseText = await generateText(prompt, { maxTokens: 2000 });

    if (!responseText) {
      return { success: false, message: "AIからの応答がありませんでした" };
    }

    // JSONを抽出
    let jsonText = responseText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .split("\n")
        .filter((line) => !line.startsWith("```"))
        .join("\n")
        .trim();
    }
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, message: "AIの応答を解析できませんでした。もう一度お試しください。" };
    }

    const parsed = JSON.parse(jsonMatch[0]) as any;

    // バリデーションと正規化
    if (!parsed.clientName || !parsed.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return { success: false, message: "取引先名と項目が必須です。メモに含まれているか確認してください。" };
    }

    // 日付のデフォルト値設定
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    const nextMonthEndStr = `${nextMonthEnd.getFullYear()}-${String(nextMonthEnd.getMonth() + 1).padStart(2, "0")}-${String(nextMonthEnd.getDate()).padStart(2, "0")}`;

    const result: MemoParseResult["data"] = {
      clientName: String(parsed.clientName || "").trim(),
      clientEmail: parsed.clientEmail ? String(parsed.clientEmail).trim() : undefined,
      clientAddress: parsed.clientAddress ? String(parsed.clientAddress).trim() : undefined,
      issueDate: parsed.issueDate || todayStr,
      validUntil: parsed.validUntil || nextMonthEndStr,
      items: parsed.items.map((item: any) => ({
        name: String(item.name || "").trim(),
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(String(item.unitPrice || 0).replace(/[,，円]/g, "")) || 0,
      })),
      note: parsed.note ? String(parsed.note).trim() : undefined,
    };

    return { success: true, data: result };
  } catch (error: any) {
    const errorMessage = error?.message || "メモの解析に失敗しました";
    return { success: false, message: errorMessage };
  }
}
