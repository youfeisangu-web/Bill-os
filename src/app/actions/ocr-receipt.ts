"use server";

import { auth } from "@clerk/nextjs/server";
import { generateContentWithImage } from "@/lib/gemini";

function formatErrorMessage(error: unknown, defaultMessage: string): string {
  if (!error) return defaultMessage;

  const errorObj = error as any;
  const errorMessage = errorObj.message || errorObj.toString() || "";
  const errorCode = errorObj.code || errorObj.status || "";

  if (errorMessage.includes("API key") || errorMessage.includes("401") || errorCode === 401) {
    return "Gemini APIキーが無効です。設定を確認してください。";
  }

  if (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("429") ||
    errorMessage.includes("RESOURCE_EXHAUSTED") ||
    errorCode === 429 ||
    errorMessage.includes("Resource exhausted")
  ) {
    return "Gemini APIの利用制限に達しました。しばらく待ってから（数分〜数時間後）再試行してください。詳細: https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429";
  }

  if (
    errorMessage.includes("タイムアウト") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("Timeout") ||
    errorCode === 504
  ) {
    return "処理に時間がかかりすぎました。ファイルサイズを小さくするか、画像の解像度を下げて再試行してください。";
  }

  const cleanMessage = (errorMessage || defaultMessage).replace(/\n/g, " ").replace(/\r/g, "").trim();
  return cleanMessage || defaultMessage;
}

const EXPENSE_CATEGORIES = ["通信費", "外注費", "消耗品", "旅費交通費", "地代家賃", "広告宣伝費", "その他"];

export type ReceiptOCRData = {
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
};

export type ReceiptOCRResult = {
  success: boolean;
  data?: ReceiptOCRData;
  message?: string;
};

const RECEIPT_OCR_PROMPT = `この画像/PDFは領収書、レシート、他社請求書、経費の明細書、国民年金の領収書などです。画像内のすべての文字を読み取り、以下の情報を抽出してください。JSON形式のみで返してください（Markdown記法は不要）。

必須項目:
- title: 店名・会社名・内容・支払先名（例: 〇〇商事、国民年金保険料、会議費、サーバー代、広告費など）。領収書の種類や支払先を明確に記載してください。
- amount: 合計金額（数値のみ、カンマは除去）。「合計額」「総額」「保険料」などの欄から金額を抽出してください。
- date: 発行日・日付（YYYY-MM-DD形式）。令和年号の場合は西暦に変換してください（例: 令和7年12月18日 → 2025-12-18）。日付が見つからない場合は現在の日付を使用してください。
- category: 経費カテゴリ。次のいずれか1つを選択: ${EXPENSE_CATEGORIES.join("、")}

カテゴリの判定基準:
- 通信費: インターネット、電話、サーバー、クラウドサービスなど
- 外注費: 外部委託、デザイン、開発、コンサルティングなど
- 消耗品: 文房具、オフィス用品、備品など
- 旅費交通費: 交通費、宿泊費、出張費など
- 地代家賃: オフィス賃貸料、駐車場代など
- 広告宣伝費: 広告費、マーケティング費用など
- その他: 上記に該当しないもの（国民年金、健康保険、税金、その他の公的費用など）

重要な注意事項:
- 画像内のすべての文字を注意深く読み取ってください
- 金額は「合計額」「総額」「保険料」などの欄から抽出してください
- 日付は令和年号を西暦に変換してください（令和7年 = 2025年）
- カテゴリは内容に応じて適切に選択してください

例: { "title": "〇〇文具店", "amount": 5500, "date": "2025-02-01", "category": "消耗品" }
例: { "title": "AWS クラウドサービス", "amount": 12000, "date": "2025-02-01", "category": "通信費" }
例: { "title": "国民年金保険料", "amount": 70040, "date": "2025-12-18", "category": "その他" }
例: { "title": "株式会社デザイン事務所", "amount": 50000, "date": "2025-02-01", "category": "外注費" }`;

/**
 * 領収書・レシート・他社請求書をOCRで読み取り、経費登録用のデータを抽出する
 */
export async function readReceiptImage(formData: FormData): Promise<ReceiptOCRResult> {
  try {
    if (!formData || !(formData instanceof FormData)) {
      return { success: false, message: "リクエストが不正です。ページを再読み込みして再試行してください。" };
    }

    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId || null;
    } catch (authError: any) {
      console.error("Auth error:", authError);
      return { success: false, message: "認証エラーが発生しました。ページを再読み込みしてください。" };
    }

    if (!userId) {
      return { success: false, message: "認証が必要です。ログインしてください。" };
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!geminiKey) {
      return { success: false, message: "Gemini APIキーが設定されていません。管理者にお問い合わせください。" };
    }

    const file = formData.get("file") as File | null;
    const fileUrl = formData.get("fileUrl") as string | null;

    let fileToProcess: File | null = null;
    let fileName = "";
    let fileSize = 0;
    let fileType = "";

    if (file) {
      fileToProcess = file;
      fileName = file.name;
      fileSize = file.size;
      fileType = file.type;

      if (fileSize === 0) {
        return { success: false, message: "ファイルが空です。正しいファイルを選択してください。" };
      }

      const VERCEL_LIMIT = 4.5 * 1024 * 1024;
      if (fileSize > VERCEL_LIMIT) {
        return {
          success: false,
          message: `ファイルサイズが大きすぎます（${Math.round(fileSize / 1024 / 1024 * 100) / 100}MB）。Vercelの制限（4.5MB）を超えています。3MB以下のファイルを選択してください。`,
        };
      }
    } else if (fileUrl) {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`ファイルのダウンロードに失敗しました: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        const urlParts = fileUrl.split("/");
        fileName = urlParts[urlParts.length - 1] || "receipt.jpg";
        fileToProcess = new File([blob], fileName, { type: blob.type });
        fileSize = blob.size;
        fileType = blob.type;
      } catch (downloadError: any) {
        return {
          success: false,
          message: `ファイルのダウンロードに失敗しました: ${downloadError?.message || String(downloadError)}`,
        };
      }
    } else {
      return { success: false, message: "ファイルが指定されていません" };
    }

    if (!fileToProcess) {
      return { success: false, message: "ファイルの取得に失敗しました" };
    }

    const fileNameLower = fileName.toLowerCase();
    const fileTypeLower = fileType.toLowerCase();
    const allowedImageTypes = [
      "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
      "image/bmp", "image/tiff", "image/tif", "image/heic", "image/heif",
    ];
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|heic|heif)$/i;
    const isImage = allowedImageTypes.includes(fileType) || imageExtensions.test(fileName);
    const isPdf = fileType === "application/pdf" || fileName.endsWith(".pdf");

    if (!isImage && !isPdf) {
      if (!fileType || fileType === "application/octet-stream") {
        if (!fileName.includes(".")) {
          return {
            success: false,
            message: `対応していないファイル形式です。対応形式: 画像（JPEG、PNG、GIF、WebP、BMP、TIFF、HEICなど）、PDF`,
          };
        }
      } else {
        return {
          success: false,
          message: `対応していないファイル形式です（${fileTypeLower}）。対応形式: 画像（JPEG、PNG、GIF、WebP、BMP、TIFF、HEICなど）、PDF`,
        };
      }
    }

    const MAX_SIZE = 50 * 1024 * 1024;
    if (fileSize > MAX_SIZE) {
      return {
        success: false,
        message: `ファイルサイズが大きすぎます（${Math.round(fileSize / 1024 / 1024)}MB）。最大サイズ: 50MB`,
      };
    }

    let base64Data: string;
    let mimeType: string;
    try {
      const arrayBuffer = await fileToProcess.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString("base64");

      if (isPdf) {
        mimeType = "application/pdf";
      } else if (isImage) {
        if (fileType.startsWith("image/")) {
          mimeType = fileType;
        } else if (fileNameLower.match(/\.(jpg|jpeg)$/i)) {
          mimeType = "image/jpeg";
        } else if (fileNameLower.match(/\.png$/i)) {
          mimeType = "image/png";
        } else if (fileNameLower.match(/\.gif$/i)) {
          mimeType = "image/gif";
        } else if (fileNameLower.match(/\.webp$/i)) {
          mimeType = "image/webp";
        } else {
          mimeType = "image/jpeg";
        }
      } else {
        mimeType = fileTypeLower || "image/jpeg";
      }
    } catch (fileError: any) {
      return {
        success: false,
        message: `ファイルの読み込みに失敗しました: ${fileError?.message || String(fileError)}`,
      };
    }

    let responseText: string;
    try {
      const TIMEOUT_MS = 60000;
      const apiCallPromise = generateContentWithImage(
        RECEIPT_OCR_PROMPT,
        base64Data,
        mimeType,
        { maxTokens: 2000, temperature: 0.1 }
      );
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`API呼び出しがタイムアウトしました（${TIMEOUT_MS / 1000}秒）。ファイルサイズが大きすぎる可能性があります。`));
        }, TIMEOUT_MS);
      });
      responseText = await Promise.race([apiCallPromise, timeoutPromise]);

      if (!responseText || typeof responseText !== "string") {
        throw new Error("APIからの応答が無効です");
      }
    } catch (apiError: any) {
      const formattedMessage = formatErrorMessage(apiError, "AIによる解析に失敗しました。しばらく待ってから再試行してください。");
      return { success: false, message: formattedMessage };
    }

    if (!responseText || responseText.trim().length === 0) {
      return { success: false, message: "AIからの応答がありませんでした。もう一度お試しください。" };
    }

    let jsonText = responseText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.split("\n").filter((line) => !line.startsWith("```")).join("\n").trim();
    }

    let jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) jsonMatch = jsonText.match(/\{.*\}/s);
    if (!jsonMatch) {
      const preview = responseText.substring(0, 200).replace(/\n/g, " ");
      return {
        success: false,
        message: `AIの応答を解析できませんでした。レスポンス: ${preview}... 画像が不鮮明な可能性があります。`,
      };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    } catch (parseError: any) {
      const preview = responseText.substring(0, 200).replace(/\n/g, " ");
      return {
        success: false,
        message: `AIの応答を解析できませんでした。レスポンス: ${preview}...`,
      };
    }

    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    const amount = Number(parsed.amount) || 0;
    let date = typeof parsed.date === "string" ? parsed.date : "";
    let category = typeof parsed.category === "string" ? parsed.category.trim() : "";

    if (!title || !amount || amount <= 0) {
      return {
        success: false,
        message: "件名または金額が抽出できませんでした。画像が不鮮明な可能性があります。",
      };
    }

    if (!date) {
      const today = new Date();
      date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return { success: false, message: "日付の形式が正しくありません（YYYY-MM-DD）。手動で修正してください。" };
    }

    if (!EXPENSE_CATEGORIES.includes(category)) category = "その他";

    return {
      success: true,
      data: {
        title: String(title).trim(),
        amount: Number(amount),
        date: String(date).trim(),
        category: String(category).trim(),
      },
    };
  } catch (error: any) {
    console.error("Receipt OCR unexpected error:", error);
    const formattedMessage = formatErrorMessage(error, "ファイルの処理に失敗しました");
    const cleanMessage = formattedMessage.replace(/\n/g, " ").trim();
    return {
      success: false,
      message: cleanMessage || "ファイルの処理に失敗しました",
    };
  }
}
