"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateContentWithImage } from "@/lib/gemini";

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
  } catch (error) {
    console.error("OCR error:", error);

    // Gemini APIエラーの場合
    if (error instanceof Error) {
      // APIキーエラー
      if (error.message.includes("API key") || error.message.includes("401")) {
        return { success: false, message: "Gemini APIキーが無効です" };
      }
      // レート制限エラー
      if (error.message.includes("rate limit") || error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED")) {
        return { success: false, message: "APIの利用制限に達しました。しばらく待ってから再試行してください" };
      }
      // その他のエラー
      return { success: false, message: `エラーが発生しました: ${error.message}` };
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
      message: error instanceof Error ? error.message : "請求書の読み込みに失敗しました",
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

const RECEIPT_OCR_PROMPT = `この画像は領収書またはレシートです。以下の情報を抽出し、JSON形式のみで返してください（Markdown記法は不要）。
- title: 店名または内容（例: 〇〇商事、会議費）
- amount: 合計金額（数値のみ）
- date: 発行日・日付（YYYY-MM-DD形式）
- category: 経費カテゴリ。次のいずれか1つ: ${EXPENSE_CATEGORIES.join("、")}

例: { "title": "〇〇文具店", "amount": 5500, "date": "2025-02-01", "category": "消耗品" }`;

/**
 * 領収書・レシート画像をOCRで読み取り、経費登録用のデータを抽出する
 */
export async function readReceiptImage(formData: FormData): Promise<ReceiptOCRResult> {
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
      RECEIPT_OCR_PROMPT,
      base64Image,
      mimeType,
      { maxTokens: 500, temperature: 0.1 }
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
    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    const amount = Number(parsed.amount) || 0;
    const date = typeof parsed.date === "string" ? parsed.date : "";
    let category = typeof parsed.category === "string" ? parsed.category.trim() : "";

    if (!title || !amount || amount <= 0)
      return { success: false, message: "件名または金額が抽出できませんでした" };

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return { success: false, message: "日付の形式が正しくありません（YYYY-MM-DD）" };

    if (!EXPENSE_CATEGORIES.includes(category)) category = "その他";

    return {
      success: true,
      data: { title, amount, date, category },
    };
  } catch (error) {
    console.error("Receipt OCR error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "領収書の読み込みに失敗しました",
    };
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

    // ファイルタイプの検証（PDF、画像）
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const isImage = allowedImageTypes.includes(file.type);
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isExcel = file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls");
    
    if (isExcel) {
      return {
        success: false,
        message: "Excelファイルは現在サポートされていません。PDFまたは画像ファイル（JPEG、PNG、GIF、WebP）を選択してください",
      };
    }
    
    if (!isImage && !isPdf) {
      return {
        success: false,
        message: "PDFまたは画像ファイル（JPEG、PNG、GIF、WebP）を選択してください",
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
      message: error instanceof Error ? error.message : "書類の読み込みに失敗しました",
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
      message: error instanceof Error ? error.message : "請求書の作成に失敗しました",
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
      message: error instanceof Error ? error.message : "見積書の作成に失敗しました",
    };
  }
}
