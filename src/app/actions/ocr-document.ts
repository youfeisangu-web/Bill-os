"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateContentWithImage } from "@/lib/gemini";
import { calcTaxAmount, type TaxRounding } from "@/lib/utils";

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

export type DocumentImportData = {
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  validUntil?: string; // YYYY-MM-DD
  invoiceNumber?: string;
  quoteNumber?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }>;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
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
  "issueDate": "2025-02-01",
  "dueDate": "2025-02-28",
  "invoiceNumber": "INV-202502-001",
  "items": [
    { "name": "〇〇利用料", "quantity": 1, "unitPrice": 10000, "taxRate": 10 }
  ],
  "totalAmount": 11000
}`;

/**
 * PDF/画像から請求書または見積書を読み込み、データを抽出する
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

    const fileNameLower = file.name.toLowerCase();
    const allowedImageTypes = [
      "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
      "image/bmp", "image/tiff", "image/tif", "image/heic", "image/heif",
    ];
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|heic|heif)$/i;
    const isImage = allowedImageTypes.includes(file.type) || imageExtensions.test(fileNameLower);
    const isPdf = file.type === "application/pdf" || fileNameLower.endsWith(".pdf");

    if (!isImage && !isPdf) {
      if (!file.type || file.type === "application/octet-stream") {
        if (!fileNameLower.includes(".")) {
          return { success: false, message: "対応していないファイル形式です。画像（JPEG、PNG、WebP、HEICなど）またはPDFを使用してください。" };
        }
      } else {
        return { success: false, message: "対応していないファイル形式です。画像（JPEG、PNG、WebP、HEICなど）またはPDFを使用してください。" };
      }
    }

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return {
        success: false,
        message: `ファイルサイズが大きすぎます（${Math.round(file.size / 1024 / 1024)}MB）。最大サイズ: 50MB`,
      };
    }

    let base64Data: string;
    let mimeType: string;
    try {
      const arrayBuffer = await file.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString("base64");

      if (isPdf) {
        mimeType = "application/pdf";
      } else if (file.type.startsWith("image/")) {
        mimeType = file.type;
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
    } catch (fileError: any) {
      return {
        success: false,
        message: `ファイルの読み込みに失敗しました: ${fileError?.message || String(fileError)}`,
      };
    }

    const prompt = `${DOCUMENT_IMPORT_PROMPT}\n\nこの書類は${documentType === "invoice" ? "請求書" : "見積書"}です。`;

    let responseText: string;
    try {
      const TIMEOUT_MS = 60000;
      const apiCallPromise = generateContentWithImage(prompt, base64Data, mimeType, {
        maxTokens: 2000,
        temperature: 0.1,
      });
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`API呼び出しがタイムアウトしました（${TIMEOUT_MS / 1000}秒）。`));
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
        return name && quantity > 0 && unitPrice >= 0 ? { name, quantity, unitPrice, taxRate } : null;
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
      if (dueDate && dateRegex.test(dueDate)) result.dueDate = dueDate;
      if (typeof parsed.invoiceNumber === "string") result.invoiceNumber = parsed.invoiceNumber.trim();
    } else {
      const validUntil = typeof parsed.validUntil === "string" ? parsed.validUntil : undefined;
      if (validUntil && dateRegex.test(validUntil)) result.validUntil = validUntil;
      if (typeof parsed.quoteNumber === "string") result.quoteNumber = parsed.quoteNumber.trim();
    }

    if (typeof parsed.subtotal === "number") result.subtotal = parsed.subtotal;
    if (typeof parsed.taxAmount === "number") result.taxAmount = parsed.taxAmount;
    if (typeof parsed.totalAmount === "number") result.totalAmount = parsed.totalAmount;

    return { success: true, data: result };
  } catch (error) {
    console.error("Document import error:", error);
    return { success: false, message: formatErrorMessage(error, "書類の読み込みに失敗しました") };
  }
}

/**
 * PDF/画像から請求書を読み込み、自動で請求書を作成する
 */
export async function importDocumentAndCreateInvoice(
  formData: FormData
): Promise<DocumentImportResult & { invoiceId?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, message: "認証が必要です" };

  const importResult = await importDocument(formData, "invoice");
  if (!importResult.success || !importResult.data) return importResult;

  const data = importResult.data;
  if (!data.dueDate) {
    const issue = new Date(data.issueDate);
    issue.setDate(issue.getDate() + 30);
    data.dueDate = `${issue.getFullYear()}-${String(issue.getMonth() + 1).padStart(2, "0")}-${String(issue.getDate()).padStart(2, "0")}`;
  }

  try {
    let clientId: string;
    const existingClient = await prisma.client.findFirst({ where: { userId, name: data.clientName } });
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const newClient = await prisma.client.create({
        data: { userId, name: data.clientName, email: data.clientEmail || null, address: data.clientAddress || null },
      });
      clientId = newClient.id;
    }

    const issueDate = new Date(`${data.issueDate}T00:00:00`);
    const dueDate = new Date(`${data.dueDate}T00:00:00`);
    const items = data.items
      .map((item) => ({ name: item.name.trim(), quantity: Number(item.quantity) || 0, unitPrice: Number(item.unitPrice) || 0 }))
      .filter((item) => item.name && item.quantity > 0 && item.unitPrice >= 0);

    if (items.length === 0) return { success: false, message: "明細が1件も抽出できませんでした" };

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const ocrUser = await prisma.userProfile.findUnique({ where: { id: userId }, select: { taxRate: true, taxRounding: true } });
    const taxRatePercent = ocrUser?.taxRate ?? 10;
    const taxRounding = (ocrUser?.taxRounding ?? "floor") as TaxRounding;
    const taxAmount = calcTaxAmount(subtotal, taxRatePercent, taxRounding);
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
        items: { create: items.map((item) => ({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice, taxRate: 10 })) },
      },
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath("/reconcile");
    return { ...importResult, invoiceId };
  } catch (error) {
    console.error("Invoice creation error:", error);
    return { success: false, message: formatErrorMessage(error, "請求書の作成に失敗しました") };
  }
}

export type BillOCRData = {
  vendorName: string; // 請求元（送付元会社名）
  title: string; // 件名・摘要
  totalAmount: number; // 合計金額（税込）
  issueDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
};

export type BillOCRResult = {
  success: boolean;
  data?: BillOCRData;
  message?: string;
  billId?: string;
};

const BILL_IMPORT_PROMPT = `この画像は他社から届いた請求書のPDF/画像です。以下の情報をすべて抽出し、JSON形式のみで返してください（Markdown記法は不要）。

必須項目:
- vendorName: 請求書の発行元（送付元）の会社名・氏名（必須）
- title: 件名・摘要・サービス内容の要約（必須）
- totalAmount: 合計金額・税込金額（数値のみ、必須）
- issueDate: 発行日（YYYY-MM-DD形式、必須）

任意項目:
- dueDate: 支払期限（YYYY-MM-DD形式、あれば）

例:
{
  "vendorName": "株式会社サンプル",
  "title": "3月分 クラウドサーバー利用料",
  "totalAmount": 11000,
  "issueDate": "2026-03-01",
  "dueDate": "2026-03-31"
}`;

/**
 * PDF/画像から受領請求書データを抽出し、支払管理に登録する
 */
export async function importDocumentAndCreateBill(
  formData: FormData,
): Promise<BillOCRResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, message: "認証が必要です" };

    const geminiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!geminiKey)
      return { success: false, message: "Gemini APIキーが設定されていません" };

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, message: "ファイルが指定されていません" };

    const fileNameLower = file.name.toLowerCase();
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/tiff",
      "image/tif",
      "image/heic",
      "image/heif",
    ];
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|heic|heif)$/i;
    const isImage =
      allowedImageTypes.includes(file.type) ||
      imageExtensions.test(fileNameLower);
    const isPdf =
      file.type === "application/pdf" || fileNameLower.endsWith(".pdf");

    if (!isImage && !isPdf) {
      return {
        success: false,
        message:
          "対応していないファイル形式です。画像（JPEG、PNG、WebP、HEICなど）またはPDFを使用してください。",
      };
    }

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return {
        success: false,
        message: `ファイルサイズが大きすぎます（${Math.round(file.size / 1024 / 1024)}MB）。最大サイズ: 50MB`,
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    let mimeType: string;
    if (isPdf) {
      mimeType = "application/pdf";
    } else if (file.type.startsWith("image/")) {
      mimeType = file.type;
    } else if (fileNameLower.match(/\.(jpg|jpeg)$/i)) {
      mimeType = "image/jpeg";
    } else if (fileNameLower.match(/\.png$/i)) {
      mimeType = "image/png";
    } else {
      mimeType = "image/jpeg";
    }

    const TIMEOUT_MS = 60000;
    const apiCallPromise = generateContentWithImage(
      BILL_IMPORT_PROMPT,
      base64Data,
      mimeType,
      { maxTokens: 1000, temperature: 0.1 },
    );
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(
        () => reject(new Error("API呼び出しがタイムアウトしました。")),
        TIMEOUT_MS,
      ),
    );
    const responseText = await Promise.race([apiCallPromise, timeoutPromise]);

    if (!responseText?.trim()) {
      return {
        success: false,
        message: "AIからの応答がありませんでした。もう一度お試しください。",
      };
    }

    let jsonText = responseText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .split("\n")
        .filter((l) => !l.startsWith("```"))
        .join("\n")
        .trim();
    }
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
      return { success: false, message: "AIの応答を解析できませんでした" };

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const vendorName =
      typeof parsed.vendorName === "string" ? parsed.vendorName.trim() : "";
    const title =
      typeof parsed.title === "string" ? parsed.title.trim() : "";
    const totalAmount = Number(parsed.totalAmount) || 0;
    const issueDate =
      typeof parsed.issueDate === "string" ? parsed.issueDate : "";
    const dueDate =
      typeof parsed.dueDate === "string" ? parsed.dueDate : undefined;

    if (!vendorName || !title || !totalAmount || !issueDate) {
      return {
        success: false,
        message:
          "必要な情報（請求元・件名・金額・発行日）が抽出できませんでした",
      };
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(issueDate)) {
      return { success: false, message: "発行日の形式が正しくありません" };
    }

    // 支払期限がない場合は発行日+30日
    let dueDateFinal = dueDate && dateRegex.test(dueDate) ? dueDate : undefined;
    if (!dueDateFinal) {
      const d = new Date(`${issueDate}T00:00:00`);
      d.setDate(d.getDate() + 30);
      dueDateFinal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    const bill = await prisma.bill.create({
      data: {
        userId,
        vendorName,
        title,
        amount: totalAmount,
        issueDate: new Date(`${issueDate}T00:00:00`),
        dueDate: new Date(`${dueDateFinal}T00:00:00`),
      },
    });

    revalidatePath("/dashboard/bills");
    revalidatePath("/dashboard");
    return { success: true, data: { vendorName, title, totalAmount, issueDate, dueDate: dueDateFinal }, billId: bill.id };
  } catch (error) {
    return {
      success: false,
      message: formatErrorMessage(error, "書類の読み込みに失敗しました"),
    };
  }
}

/**
 * PDF/画像から見積書を読み込み、自動で見積書を作成する
 */
export async function importDocumentAndCreateQuote(
  formData: FormData
): Promise<DocumentImportResult & { quoteId?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, message: "認証が必要です" };

  const importResult = await importDocument(formData, "quote");
  if (!importResult.success || !importResult.data) return importResult;

  const data = importResult.data;
  if (!data.validUntil) {
    const issue = new Date(data.issueDate);
    issue.setDate(issue.getDate() + 30);
    data.validUntil = `${issue.getFullYear()}-${String(issue.getMonth() + 1).padStart(2, "0")}-${String(issue.getDate()).padStart(2, "0")}`;
  }

  try {
    let clientId: string;
    const existingClient = await prisma.client.findFirst({ where: { userId, name: data.clientName } });
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const newClient = await prisma.client.create({
        data: { userId, name: data.clientName, email: data.clientEmail || null, address: data.clientAddress || null },
      });
      clientId = newClient.id;
    }

    const issueDate = new Date(`${data.issueDate}T00:00:00`);
    const validUntil = new Date(`${data.validUntil}T00:00:00`);
    const items = data.items
      .map((item) => ({ name: item.name.trim(), quantity: Number(item.quantity) || 0, unitPrice: Number(item.unitPrice) || 0 }))
      .filter((item) => item.name && item.quantity > 0 && item.unitPrice >= 0);

    if (items.length === 0) return { success: false, message: "明細が1件も抽出できませんでした" };

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const ocrUser = await prisma.userProfile.findUnique({ where: { id: userId }, select: { taxRate: true, taxRounding: true } });
    const taxRatePercent = ocrUser?.taxRate ?? 10;
    const taxRounding = (ocrUser?.taxRounding ?? "floor") as TaxRounding;
    const taxAmount = calcTaxAmount(subtotal, taxRatePercent, taxRounding);
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
    return { success: false, message: formatErrorMessage(error, "見積書の作成に失敗しました") };
  }
}
