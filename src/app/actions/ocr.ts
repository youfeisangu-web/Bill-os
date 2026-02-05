"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateContentWithImage } from "@/lib/gemini";

/** エラーメッセージを適切にフォーマットする */
function formatErrorMessage(error: unknown, defaultMessage: string): string {
  if (!error) return defaultMessage;
  
  const errorObj = error as any;
  const errorMessage = errorObj.message || errorObj.toString() || "";
  const errorCode = errorObj.code || errorObj.status || "";
  
  // APIキーエラー
  if (errorMessage.includes("API key") || errorMessage.includes("401") || errorCode === 401) {
    return "Gemini APIキーが無効です。設定を確認してください。";
  }
  
  // レート制限エラー（429）
  if (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("429") ||
    errorMessage.includes("RESOURCE_EXHAUSTED") ||
    errorCode === 429 ||
    errorMessage.includes("Resource exhausted")
  ) {
    return "Gemini APIの利用制限に達しました。\n\nしばらく待ってから（数分〜数時間後）再試行してください。\n\n詳細: https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429";
  }
  
  // タイムアウトエラー
  if (
    errorMessage.includes("タイムアウト") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("Timeout") ||
    errorCode === 504
  ) {
    return "処理に時間がかかりすぎました。ファイルサイズを小さくするか、画像の解像度を下げて再試行してください。";
  }
  
  // その他のエラー
  return errorMessage || defaultMessage;
}

const TAX_RATE = 0.1;

const formatInvoiceId = (date: Date, sequence: number) => {
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const seq = String(sequence).padStart(3, "0");
  return `INV-${year}${month}-${seq}`;
};

const formatQuoteId = (date: Date, sequence: number) => {
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const seq = String(sequence).padStart(3, "0");
  return `QTE-${year}${month}-${seq}`;
};

type OCRResult = {
  success: boolean;
  data?: {
    date: string; // YYYY-MM-DD形式
    amount: number;
    name: string; // 振込名義（カナ推奨）
  };
  message?: string;
};

/**
 * 通帳または振込明細の画像をOCRで読み取り、取引データを抽出する
 * @param formData FormData（fileフィールドに画像ファイルを含む）
 * @returns OCRResult
 */
export async function readBankBookImage(formData: FormData): Promise<OCRResult> {
  try {
    // 認証チェック
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "認証が必要です" };
    }

    // APIキーのチェック
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!geminiKey) {
      return { success: false, message: "Gemini APIキーが設定されていません（GEMINI_API_KEY または GOOGLE_GENERATIVE_AI_API_KEY）" };
    }

    // FormDataからファイルを取得
    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, message: "画像ファイルが指定されていません" };
    }

    // ファイルタイプの検証
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, message: "画像ファイル（JPEG、PNG、GIF、WebP）を選択してください" };
    }

    // ファイルサイズの検証（10MB以下）
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, message: "ファイルサイズは10MB以下にしてください" };
    }

    // ファイルをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Base64エンコード
    const base64Image = buffer.toString("base64");

    // MIMEタイプを取得（デフォルトはjpeg）
    const mimeType = file.type || "image/jpeg";

    // Gemini Vision APIにリクエストを送信
    const prompt =
      "この通帳または振込明細の画像を解析し、最新の取引データを抽出してください。以下のJSON形式のみを返してください（Markdown記法は不要）: { date: 'YYYY-MM-DD', amount: 数値, name: '振込名義（カタカナ推奨）' }";
    const responseText = await generateContentWithImage(
      prompt,
      base64Image,
      mimeType,
      { maxTokens: 500, temperature: 0.1 }
    );
    if (!responseText) {
      return { success: false, message: "AIからの応答がありませんでした" };
    }

    // JSONを抽出（Markdownコードブロックがある場合を考慮）
    let jsonText = responseText.trim();
    
    // Markdownコードブロックを除去
    if (jsonText.startsWith("```")) {
      const lines = jsonText.split("\n");
      jsonText = lines
        .filter((line) => !line.startsWith("```"))
        .join("\n")
        .trim();
    }

    // JSONをパース
    let parsedData: { date: string; amount: number; name: string };
    try {
      parsedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Response text:", responseText);
      return { success: false, message: "AIの応答を解析できませんでした" };
    }

    // データの検証
    if (!parsedData.date || !parsedData.amount || !parsedData.name) {
      return { success: false, message: "必要なデータが抽出できませんでした" };
    }

    // 日付形式の検証（YYYY-MM-DD）
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(parsedData.date)) {
      return { success: false, message: "日付の形式が正しくありません（YYYY-MM-DD形式が必要）" };
    }

    // 金額の検証（数値であること）
    const amount = Number(parsedData.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, message: "金額が正しくありません" };
    }

    return {
      success: true,
      data: {
        date: parsedData.date,
        amount: amount,
        name: parsedData.name.trim(),
      },
    };
  } catch (error: any) {
    console.error("OCR error:", error);

    // Gemini APIエラーの場合
    if (error) {
      const errorMessage = error.message || error.toString() || "";
      const errorCode = error.code || error.status || "";
      
      // APIキーエラー
      if (errorMessage.includes("API key") || errorMessage.includes("401") || errorCode === 401) {
        return { success: false, message: "Gemini APIキーが無効です。設定を確認してください。" };
      }
      // レート制限エラー（429）
      if (errorMessage.includes("rate limit") || errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorCode === 429) {
        return { 
          success: false, 
          message: "Gemini APIの利用制限に達しました。\n\nしばらく待ってから（数分〜数時間後）再試行してください。\n\n詳細: https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429" 
        };
      }
      // その他のエラー
      return { success: false, message: `エラーが発生しました: ${errorMessage || "不明なエラー"}` };
    }

    return { success: false, message: "予期しないエラーが発生しました" };
  }
}

// --- 請求書OCR ---

export type InvoiceOCRData = {
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
  issueDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
};

export type InvoiceOCRResult = {
  success: boolean;
  data?: InvoiceOCRData;
  message?: string;
};

const INVOICE_OCR_PROMPT = `この画像は請求書です。以下の情報を抽出し、JSON形式のみで返してください（Markdown記法は不要）。
- clientName: 請求先・取引先の名前（必須）
- clientEmail: メールアドレス（あれば）
- clientAddress: 住所（あれば）
- issueDate: 発行日（YYYY-MM-DD形式）
- dueDate: 支払期限（YYYY-MM-DD形式）
- items: 明細の配列。各要素は { "name": "項目名", "quantity": 数量（数値）, "unitPrice": 単価（税抜き数値） }

例: { "clientName": "株式会社サンプル", "issueDate": "2025-02-01", "dueDate": "2025-02-28", "items": [{ "name": "〇〇利用料", "quantity": 1, "unitPrice": 10000 }] }`;

/**
 * 請求書画像をOCRで読み取り、請求書フォーム用のデータを抽出する
 */
export async function readInvoiceImage(formData: FormData): Promise<InvoiceOCRResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, message: "認証が必要です" };

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!geminiKey) return { success: false, message: "Gemini APIキーが設定されていません" };

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, message: "画像ファイルが指定されていません" };

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type))
      return { success: false, message: "画像ファイル（JPEG、PNG、GIF、WebP）を選択してください" };

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) return { success: false, message: "ファイルサイズは10MB以下にしてください" };

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    const responseText = await generateContentWithImage(
      INVOICE_OCR_PROMPT,
      base64Image,
      mimeType,
      { maxTokens: 1000, temperature: 0.1 }
    );
    if (!responseText) return { success: false, message: "AIからの応答がありませんでした" };

    let jsonText = responseText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .split("\n")
        .filter((line) => !line.startsWith("```"))
        .join("\n")
        .trim();
    }
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { success: false, message: "AIの応答を解析できませんでした" };

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const itemsRaw = Array.isArray(parsed.items) ? parsed.items : [];
    const items = itemsRaw
      .map((row: unknown) => {
        const r = row as Record<string, unknown>;
        const name = typeof r.name === "string" ? r.name.trim() : "";
        const quantity = Number(r.quantity) || 0;
        const unitPrice = Number(r.unitPrice) || 0;
        return name ? { name, quantity, unitPrice } : null;
      })
      .filter((x): x is { name: string; quantity: number; unitPrice: number } => x !== null);

    if (items.length === 0) return { success: false, message: "明細が1件も抽出できませんでした" };

    const clientName = typeof parsed.clientName === "string" ? parsed.clientName.trim() : undefined;
    const issueDate = typeof parsed.issueDate === "string" ? parsed.issueDate : undefined;
    const dueDate = typeof parsed.dueDate === "string" ? parsed.dueDate : undefined;

    return {
      success: true,
      data: {
        clientName,
        clientEmail: typeof parsed.clientEmail === "string" ? parsed.clientEmail.trim() : undefined,
        clientAddress: typeof parsed.clientAddress === "string" ? parsed.clientAddress.trim() : undefined,
        issueDate,
        dueDate,
        items,
      },
    };
  } catch (error) {
    console.error("Invoice OCR error:", error);
    return {
      success: false,
      message: formatErrorMessage(error, "請求書の読み込みに失敗しました"),
    };
  }
}

// --- 領収書OCR（経費登録用） ---

const EXPENSE_CATEGORIES = ["通信費", "外注費", "消耗品", "旅費交通費", "地代家賃", "広告宣伝費", "その他"];

export type ReceiptOCRData = {
  title: string; // 店名・内容
  amount: number;
  date: string; // YYYY-MM-DD
  category: string; // 上記のいずれか
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
 * CSV、画像、PDFに対応
 */
export async function readReceiptImage(formData: FormData): Promise<ReceiptOCRResult> {
  // 最外層のtry-catchで、すべての予期しないエラーを確実にキャッチ
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "認証が必要です。ログインしてください。" };
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!geminiKey) {
      return { success: false, message: "Gemini APIキーが設定されていません。管理者にお問い合わせください。" };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, message: "ファイルが指定されていません" };
    }

    // ファイルタイプの検証（画像、PDF、Office文書など幅広く対応）
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    // 対応する画像形式を拡張
    const allowedImageTypes = [
      "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
      "image/bmp", "image/tiff", "image/tif", "image/heic", "image/heif",
      "image/svg+xml", "image/x-icon"
    ];
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|heic|heif|svg|ico)$/i;
    const isImage = allowedImageTypes.includes(fileType) || imageExtensions.test(fileName);
    
    // PDF形式
    const isPdf = fileType === "application/pdf" || fileName.endsWith(".pdf");
    
    // Office文書形式（Excel, Word）
    const officeExtensions = /\.(xlsx|xls|docx|doc)$/i;
    const officeMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/msword" // .doc
    ];
    const isOffice = officeMimeTypes.includes(fileType) || officeExtensions.test(fileName);
    
    // テキストファイル
    const textExtensions = /\.(txt|csv)$/i;
    const isText = fileType.startsWith("text/") || textExtensions.test(fileName);
    
    // ファイル形式がサポートされていない場合
    if (!isImage && !isPdf && !isOffice && !isText) {
      // ファイルタイプが空の場合は拡張子で判定を試みる
      if (!fileType || fileType === "application/octet-stream") {
        // 拡張子がある場合は許可（多くの場合、ブラウザが正しくMIMEタイプを判定できない）
        if (fileName.includes(".")) {
          console.log("File type unknown, but has extension. Allowing:", fileName);
        } else {
          return { 
            success: false, 
            message: `対応していないファイル形式です。\n\n対応形式: 画像（JPEG、PNG、GIF、WebP、BMP、TIFF、HEICなど）、PDF、Excel（.xlsx、.xls）、Word（.docx、.doc）、テキスト（.txt、.csv）\n\n選択されたファイル: ${file.name}` 
          };
        }
      } else {
        return { 
          success: false, 
          message: `対応していないファイル形式です（${fileType}）。\n\n対応形式: 画像（JPEG、PNG、GIF、WebP、BMP、TIFF、HEICなど）、PDF、Excel（.xlsx、.xls）、Word（.docx、.doc）、テキスト（.txt、.csv）\n\n選択されたファイル: ${file.name}` 
        };
      }
    }

    // ファイルサイズ制限を緩和（50MBまで）
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      return { 
        success: false, 
        message: `ファイルサイズが大きすぎます（${Math.round(file.size / 1024 / 1024)}MB）。\n\n最大サイズ: 50MB\n\nファイルサイズを小さくするか、画像の解像度を下げて再試行してください。` 
      };
    }

    // ファイル処理（タイムアウト対策として、大きなファイルの処理を最適化）
    let buffer: Buffer;
    let base64Data: string;
    let mimeType: string;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      base64Data = buffer.toString("base64");
      
      // MIMEタイプの決定（Gemini APIがサポートする形式に合わせる）
      if (isPdf) {
        mimeType = "application/pdf";
      } else if (isImage) {
        // 画像形式のMIMEタイプを正規化
        if (fileType.startsWith("image/")) {
          mimeType = fileType;
        } else if (fileName.match(/\.(jpg|jpeg)$/i)) {
          mimeType = "image/jpeg";
        } else if (fileName.match(/\.png$/i)) {
          mimeType = "image/png";
        } else if (fileName.match(/\.gif$/i)) {
          mimeType = "image/gif";
        } else if (fileName.match(/\.webp$/i)) {
          mimeType = "image/webp";
        } else if (fileName.match(/\.(bmp|tiff|tif)$/i)) {
          // BMPやTIFFはPNGとして扱う（Geminiが直接サポートしない場合がある）
          mimeType = "image/png";
        } else {
          mimeType = "image/jpeg"; // デフォルト
        }
      } else if (isOffice || isText) {
        // Office文書やテキストファイルは、Gemini APIが直接サポートしないため、
        // PDFとして扱うか、エラーメッセージを表示
        // ただし、実際にはGeminiは画像とPDFのみをサポートするため、
        // ここではエラーを返す
        return {
          success: false,
          message: `Office文書（.xlsx、.xls、.docx、.doc）やテキストファイル（.txt、.csv）は、現在画像やPDFに変換してからアップロードしてください。\n\n選択されたファイル: ${file.name}`,
        };
      } else {
        // その他のファイル形式
        mimeType = fileType || "image/jpeg";
      }
      
      // base64データが大きすぎる場合の警告
      if (base64Data.length > 15 * 1024 * 1024) { // 約15MB
        console.warn("Large base64 data:", base64Data.length, "bytes");
      }
    } catch (fileError: any) {
      console.error("File processing error:", fileError);
      const errorMsg = fileError?.message || String(fileError);
      return {
        success: false,
        message: `ファイルの読み込みに失敗しました: ${errorMsg}`,
      };
    }

    // Gemini API呼び出し（タイムアウト対策）
    let responseText: string;
    try {
      console.log("Calling Gemini API...", {
        fileName: file.name,
        fileSize: file.size,
        mimeType: mimeType,
        base64Length: base64Data.length,
      });
      
      // タイムアウトを設定（VercelのServerless Functionの制限を考慮）
      const apiCallPromise = generateContentWithImage(
        RECEIPT_OCR_PROMPT,
        base64Data,
        mimeType,
        { maxTokens: 2000, temperature: 0.1 } // maxTokensを増やして詳細なレスポンスを取得
      );
      
      // 60秒でタイムアウト（Vercel Proプランの制限）
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("API呼び出しがタイムアウトしました。ファイルサイズが大きすぎる可能性があります。")), 60000);
      });
      
      responseText = await Promise.race([apiCallPromise, timeoutPromise]);
      
      console.log("Gemini API response received:", {
        responseLength: responseText?.length || 0,
        responsePreview: responseText?.substring(0, 200) || "empty",
      });
    } catch (apiError: any) {
      console.error("Gemini API error:", apiError);
      console.error("Error type:", typeof apiError);
      console.error("Error keys:", Object.keys(apiError || {}));
      
      // エラーメッセージを安全に取得
      let errorMsg = "AIによる解析に失敗しました";
      try {
        if (apiError?.message) {
          errorMsg = String(apiError.message);
        } else if (typeof apiError === "string") {
          errorMsg = apiError;
        } else {
          errorMsg = String(apiError);
        }
      } catch (e) {
        errorMsg = "AIによる解析に失敗しました（エラーの詳細を取得できませんでした）";
      }
      
      // タイムアウトエラーの場合
      if (errorMsg.includes("タイムアウト") || errorMsg.includes("timeout") || errorMsg.includes("Timeout")) {
        return {
          success: false,
          message: "処理に時間がかかりすぎました。ファイルサイズを小さくするか、画像の解像度を下げて再試行してください。",
        };
      }
      
      // フォーマットされたエラーメッセージを返す
      const formattedMessage = formatErrorMessage(apiError, "AIによる解析に失敗しました。しばらく待ってから再試行してください。");
      return {
        success: false,
        message: formattedMessage,
      };
    }
    
    if (!responseText || responseText.trim().length === 0) {
      return { success: false, message: "AIからの応答がありませんでした。もう一度お試しください。" };
    }

    // JSON解析
    let jsonText = responseText.trim();
    console.log("Raw response text:", jsonText.substring(0, 500));
    
    // Markdownコードブロックを除去
    if (jsonText.startsWith("```")) {
      const lines = jsonText.split("\n");
      jsonText = lines
        .filter((line) => !line.startsWith("```"))
        .join("\n")
        .trim();
      console.log("After removing markdown:", jsonText.substring(0, 500));
    }
    
    // JSONオブジェクトを抽出（複数の方法を試す）
    let jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // 別のパターンを試す
      jsonMatch = jsonText.match(/\{.*\}/s);
    }
    if (!jsonMatch) {
      console.error("JSON parse failed. Full response:", responseText);
      return { 
        success: false, 
        message: `AIの応答を解析できませんでした。\n\nレスポンス: ${responseText.substring(0, 500)}\n\n画像が不鮮明な可能性があります。別の画像をお試しください。` 
      };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      console.log("Parsed JSON:", parsed);
    } catch (parseError: any) {
      console.error("JSON parse error:", parseError);
      console.error("Full response text:", responseText);
      console.error("Matched JSON string:", jsonMatch[0]);
      return {
        success: false,
        message: `AIの応答を解析できませんでした。\n\nレスポンス: ${responseText.substring(0, 500)}\n\n画像が不鮮明な可能性があります。別の画像をお試しください。`,
      };
    }

    // データ検証
    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    const amount = Number(parsed.amount) || 0;
    let date = typeof parsed.date === "string" ? parsed.date : "";
    let category = typeof parsed.category === "string" ? parsed.category.trim() : "";

    if (!title || !amount || amount <= 0) {
      return { 
        success: false, 
        message: "件名または金額が抽出できませんでした。画像が不鮮明な可能性があります。別の画像をお試しください。" 
      };
    }

    // 日付が空の場合は現在の日付を使用
    if (!date) {
      const today = new Date();
      date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return { success: false, message: "日付の形式が正しくありません（YYYY-MM-DD）。手動で修正してください。" };
    }

    if (!EXPENSE_CATEGORIES.includes(category)) category = "その他";

    // 成功レスポンス（シリアライズ可能な形式を保証）
    const result: ReceiptOCRResult = {
      success: true,
      data: { 
        title: String(title), 
        amount: Number(amount), 
        date: String(date), 
        category: String(category) 
      },
    };
    
    return result;
  } catch (error: any) {
    // すべての予期しないエラーをキャッチ
    console.error("Receipt OCR unexpected error:", error);
    console.error("Error type:", typeof error);
    console.error("Error constructor:", error?.constructor?.name);
    
    // エラーメッセージを安全に取得（シリアライズ可能な形式に変換）
    let errorMessage = "領収書の読み込みに失敗しました";
    try {
      if (error && typeof error === "object") {
        // エラーオブジェクトからメッセージを抽出
        if (error.message) {
          errorMessage = String(error.message);
        } else if (error.toString && typeof error.toString === "function") {
          const errorString = error.toString();
          if (errorString !== "[object Object]") {
            errorMessage = errorString;
          }
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      } else {
        errorMessage = String(error);
      }
    } catch (e) {
      // エラーメッセージの取得に失敗した場合
      console.error("Failed to extract error message:", e);
      errorMessage = "予期しないエラーが発生しました";
    }
    
    // フォーマットされたエラーメッセージを取得
    const formattedMessage = formatErrorMessage(error, errorMessage);
    
    // 確実にシリアライズ可能な形式で返す（プレーンなオブジェクトのみ）
    const response: ReceiptOCRResult = {
      success: false,
      message: formattedMessage || "予期しないエラーが発生しました。しばらく待ってから再試行してください。",
    };
    
    return response;
  }
}

// --- 書類から請求書・見積書を自動作成 ---

export type DocumentImportData = {
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD (請求書用)
  validUntil?: string; // YYYY-MM-DD (見積書用)
  invoiceNumber?: string; // 請求書番号（あれば）
  quoteNumber?: string; // 見積書番号（あれば）
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number; // デフォルト10%
  }>;
  subtotal?: number; // 小計（検証用）
  taxAmount?: number; // 消費税（検証用）
  totalAmount?: number; // 合計（検証用）
};

export type DocumentImportResult = {
  success: boolean;
  data?: DocumentImportData;
  message?: string;
};

const DOCUMENT_IMPORT_PROMPT = `この画像は請求書または見積書のPDF/画像です。以下の情報をすべて抽出し、JSON形式のみで返してください（Markdown記法は不要）。

必須項目:
- clientName: 取引先名・請求先名（必須）
- issueDate: 発行日（YYYY-MM-DD形式、必須）
- items: 明細の配列（必須）。各要素は { "name": "項目名", "quantity": 数量（数値）, "unitPrice": 単価（税抜き数値）, "taxRate": 税率（%）、デフォルト10 }

請求書の場合:
- dueDate: 支払期限（YYYY-MM-DD形式）
- invoiceNumber: 請求書番号（あれば）

見積書の場合:
- validUntil: 有効期限（YYYY-MM-DD形式）
- quoteNumber: 見積書番号（あれば）

任意項目:
- clientEmail: メールアドレス（あれば）
- clientAddress: 住所（あれば）
- subtotal: 小計（検証用、あれば）
- taxAmount: 消費税額（検証用、あれば）
- totalAmount: 合計金額（検証用、あれば）

例（請求書）:
{
  "clientName": "株式会社サンプル",
  "clientEmail": "info@example.com",
  "clientAddress": "東京都千代田区...",
  "issueDate": "2025-02-01",
  "dueDate": "2025-02-28",
  "invoiceNumber": "INV-202502-001",
  "items": [
    { "name": "〇〇利用料", "quantity": 1, "unitPrice": 10000, "taxRate": 10 },
    { "name": "システム利用料", "quantity": 1, "unitPrice": 5000, "taxRate": 10 }
  ],
  "subtotal": 15000,
  "taxAmount": 1500,
  "totalAmount": 16500
}

例（見積書）:
{
  "clientName": "株式会社サンプル",
  "issueDate": "2025-02-01",
  "validUntil": "2025-03-01",
  "quoteNumber": "QTE-202502-001",
  "items": [
    { "name": "開発費", "quantity": 1, "unitPrice": 50000, "taxRate": 10 }
  ],
  "totalAmount": 55000
}`;

/**
 * PDF/画像から請求書または見積書を読み込み、データを抽出する
 * @param formData FormData（fileフィールドにPDF/画像ファイルを含む）
 * @param documentType "invoice" | "quote"
 */
export async function importDocument(
  formData: FormData,
  documentType: "invoice" | "quote"
): Promise<DocumentImportResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, message: "認証が必要です" };

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!geminiKey) return { success: false, message: "Gemini APIキーが設定されていません" };

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, message: "ファイルが指定されていません" };

    // デバッグ情報
    console.log("サーバー側で受け取ったファイル:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // ファイルタイプの検証（PDF、画像）
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const fileName = file.name.toLowerCase();
    const isImage = allowedImageTypes.includes(file.type) || 
                     fileName.endsWith(".jpg") || 
                     fileName.endsWith(".jpeg") || 
                     fileName.endsWith(".png") || 
                     fileName.endsWith(".gif") || 
                     fileName.endsWith(".webp");
    const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    
    if (isExcel) {
      return {
        success: false,
        message: "Excelファイルは現在サポートされていません。PDFまたは画像ファイル（JPEG、PNG、GIF、WebP）を選択してください",
      };
    }
    
    if (!isImage && !isPdf) {
      return {
        success: false,
        message: `PDFまたは画像ファイル（JPEG、PNG、GIF、WebP）を選択してください。選択されたファイル: ${file.name} (タイプ: ${file.type || "不明"})`,
      };
    }

    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_SIZE) {
      return { success: false, message: "ファイルサイズは20MB以下にしてください" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");
    const mimeType = isPdf ? "application/pdf" : file.type || "image/jpeg";

    const prompt = `${DOCUMENT_IMPORT_PROMPT}\n\nこの書類は${documentType === "invoice" ? "請求書" : "見積書"}です。`;

    const responseText = await generateContentWithImage(
      prompt,
      base64Data,
      mimeType,
      { maxTokens: 2000, temperature: 0.1 }
    );
    if (!responseText) return { success: false, message: "AIからの応答がありませんでした" };

    let jsonText = responseText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .split("\n")
        .filter((line) => !line.startsWith("```"))
        .join("\n")
        .trim();
    }
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { success: false, message: "AIの応答を解析できませんでした" };

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const clientName = typeof parsed.clientName === "string" ? parsed.clientName.trim() : "";
    const issueDate = typeof parsed.issueDate === "string" ? parsed.issueDate : "";

    if (!clientName || !issueDate) {
      return { success: false, message: "取引先名または発行日が抽出できませんでした" };
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(issueDate)) {
      return { success: false, message: "発行日の形式が正しくありません（YYYY-MM-DD）" };
    }

    const itemsRaw = Array.isArray(parsed.items) ? parsed.items : [];
    const items = itemsRaw
      .map((row: unknown) => {
        const r = row as Record<string, unknown>;
        const name = typeof r.name === "string" ? r.name.trim() : "";
        const quantity = Number(r.quantity) || 0;
        const unitPrice = Number(r.unitPrice) || 0;
        const taxRate = Number(r.taxRate) || 10;
        return name && quantity > 0 && unitPrice >= 0
          ? { name, quantity, unitPrice, taxRate }
          : null;
      })
      .filter((x): x is { name: string; quantity: number; unitPrice: number; taxRate: number } => x !== null);

    if (items.length === 0) {
      return { success: false, message: "明細が1件も抽出できませんでした" };
    }

    const result: DocumentImportData = {
      clientName,
      clientEmail: typeof parsed.clientEmail === "string" ? parsed.clientEmail.trim() : undefined,
      clientAddress: typeof parsed.clientAddress === "string" ? parsed.clientAddress.trim() : undefined,
      issueDate,
      items,
    };

    if (documentType === "invoice") {
      const dueDate = typeof parsed.dueDate === "string" ? parsed.dueDate : undefined;
      if (dueDate && dateRegex.test(dueDate)) {
        result.dueDate = dueDate;
      }
      if (typeof parsed.invoiceNumber === "string") {
        result.invoiceNumber = parsed.invoiceNumber.trim();
      }
    } else {
      const validUntil = typeof parsed.validUntil === "string" ? parsed.validUntil : undefined;
      if (validUntil && dateRegex.test(validUntil)) {
        result.validUntil = validUntil;
      }
      if (typeof parsed.quoteNumber === "string") {
        result.quoteNumber = parsed.quoteNumber.trim();
      }
    }

    if (typeof parsed.subtotal === "number") result.subtotal = parsed.subtotal;
    if (typeof parsed.taxAmount === "number") result.taxAmount = parsed.taxAmount;
    if (typeof parsed.totalAmount === "number") result.totalAmount = parsed.totalAmount;

    return { success: true, data: result };
  } catch (error) {
    console.error("Document import error:", error);
    return {
      success: false,
      message: formatErrorMessage(error, "書類の読み込みに失敗しました"),
    };
  }
}

/**
 * PDF/画像から請求書を読み込み、自動で請求書を作成する
 */
export async function importDocumentAndCreateInvoice(formData: FormData): Promise<DocumentImportResult & { invoiceId?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, message: "認証が必要です" };

  const importResult = await importDocument(formData, "invoice");
  if (!importResult.success || !importResult.data) {
    return importResult;
  }

  const data = importResult.data;
  if (!data.dueDate) {
    const issue = new Date(data.issueDate);
    issue.setDate(issue.getDate() + 30);
    data.dueDate = `${issue.getFullYear()}-${String(issue.getMonth() + 1).padStart(2, "0")}-${String(issue.getDate()).padStart(2, "0")}`;
  }

  try {
    // 取引先の作成または取得
    let clientId: string;
    const existingClient = await prisma.client.findFirst({
      where: { userId, name: data.clientName },
    });
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const newClient = await prisma.client.create({
        data: {
          userId,
          name: data.clientName,
          email: data.clientEmail || null,
          address: data.clientAddress || null,
        },
      });
      clientId = newClient.id;
    }

    const issueDate = new Date(`${data.issueDate}T00:00:00`);
    const dueDate = new Date(`${data.dueDate}T00:00:00`);

    const items = data.items.map((item) => ({
      name: item.name.trim(),
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
    })).filter((item) => item.name && item.quantity > 0 && item.unitPrice >= 0);

    if (items.length === 0) {
      return { success: false, message: "明細が1件も抽出できませんでした" };
    }

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = Math.round(subtotal * TAX_RATE);
    const totalAmount = subtotal + taxAmount;

    const yyyymm = `${issueDate.getFullYear()}${String(issueDate.getMonth() + 1).padStart(2, "0")}`;
    const latest = await prisma.invoice.findFirst({
      where: { userId, id: { startsWith: `INV-${yyyymm}-` } },
      orderBy: { id: "desc" },
    });
    const latestSeq = latest?.id.split("-")[2];
    const sequence = latestSeq ? Number(latestSeq) + 1 : 1;
    const invoiceId = formatInvoiceId(issueDate, sequence);

    await prisma.invoice.create({
      data: {
        id: invoiceId,
        userId,
        clientId,
        status: "未払い",
        issueDate,
        dueDate,
        subtotal,
        taxAmount,
        withholdingTax: 0,
        totalAmount,
        items: {
          create: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: 10,
          })),
        },
      },
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath("/reconcile");
    return { ...importResult, invoiceId };
  } catch (error) {
    console.error("Invoice creation error:", error);
    return {
      success: false,
      message: formatErrorMessage(error, "請求書の作成に失敗しました"),
    };
  }
}

/**
 * PDF/画像から見積書を読み込み、自動で見積書を作成する
 */
export async function importDocumentAndCreateQuote(formData: FormData): Promise<DocumentImportResult & { quoteId?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, message: "認証が必要です" };

  const importResult = await importDocument(formData, "quote");
  if (!importResult.success || !importResult.data) {
    return importResult;
  }

  const data = importResult.data;
  if (!data.validUntil) {
    const issue = new Date(data.issueDate);
    issue.setDate(issue.getDate() + 30);
    data.validUntil = `${issue.getFullYear()}-${String(issue.getMonth() + 1).padStart(2, "0")}-${String(issue.getDate()).padStart(2, "0")}`;
  }

  try {
    // 取引先の作成または取得
    let clientId: string;
    const existingClient = await prisma.client.findFirst({
      where: { userId, name: data.clientName },
    });
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const newClient = await prisma.client.create({
        data: {
          userId,
          name: data.clientName,
          email: data.clientEmail || null,
          address: data.clientAddress || null,
        },
      });
      clientId = newClient.id;
    }

    const issueDate = new Date(`${data.issueDate}T00:00:00`);
    const validUntil = new Date(`${data.validUntil}T00:00:00`);

    const items = data.items.map((item) => ({
      name: item.name.trim(),
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
    })).filter((item) => item.name && item.quantity > 0 && item.unitPrice >= 0);

    if (items.length === 0) {
      return { success: false, message: "明細が1件も抽出できませんでした" };
    }

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = Math.round(subtotal * TAX_RATE);
    const totalAmount = subtotal + taxAmount;

    const yyyymm = `${issueDate.getFullYear()}${String(issueDate.getMonth() + 1).padStart(2, "0")}`;
    const latest = await prisma.quote.findFirst({
      where: { userId, quoteNumber: { startsWith: `QTE-${yyyymm}-` } },
      orderBy: { quoteNumber: "desc" },
    });
    const latestSeq = latest?.quoteNumber.split("-")[2];
    const sequence = latestSeq ? Number(latestSeq) + 1 : 1;
    const quoteNumber = formatQuoteId(issueDate, sequence);

    await prisma.quote.create({
      data: {
        userId,
        clientId,
        quoteNumber,
        status: "下書き",
        issueDate,
        validUntil,
        subtotal,
        taxAmount,
        totalAmount,
        items: {
          create: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: 10,
            isOptional: false,
            isSelected: true,
          })),
        },
      },
    });

    revalidatePath("/dashboard/quotes");
    return { ...importResult, quoteId: quoteNumber };
  } catch (error) {
    console.error("Quote creation error:", error);
    return {
      success: false,
      message: formatErrorMessage(error, "見積書の作成に失敗しました"),
    };
  }
}
