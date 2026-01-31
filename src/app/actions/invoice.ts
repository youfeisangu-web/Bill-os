"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type SubmitResult = {
  success: boolean;
  message: string;
};

const TAX_RATE = 0.1;

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const parseDate = (value: string) => {
  if (!value) {
    return null;
  }
  return new Date(`${value}T00:00:00`);
};

const formatInvoiceId = (date: Date, sequence: number) => {
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const seq = String(sequence).padStart(3, "0");
  return `INV-${year}${month}-${seq}`;
};

export async function createInvoice(formData: FormData): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const clientId = getValue(formData, "clientId");
    const clientName = getValue(formData, "clientName");
    const clientEmail = getValue(formData, "clientEmail");
    const clientAddress = getValue(formData, "clientAddress");
    const issueDateRaw = getValue(formData, "issueDate");
    const dueDateRaw = getValue(formData, "dueDate");
    const itemsRaw = getValue(formData, "items");

    // 新規顧客の場合は clientName が必須
    if (!clientId && !clientName) {
      return { success: false, message: "取引先を選択するか、新規取引先名を入力してください。" };
    }

    if (!issueDateRaw || !dueDateRaw || !itemsRaw) {
      return { success: false, message: "必須項目を入力してください。" };
    }

    // 新規顧客の場合は自動的に顧客を作成
    let finalClientId = clientId;
    if (!clientId && clientName) {
      const newClient = await prisma.client.create({
        data: {
          userId: userId,
          name: clientName,
          email: clientEmail || null,
          address: clientAddress || null,
        },
      });
      finalClientId = newClient.id;
    }

    const issueDate = parseDate(issueDateRaw);
    const dueDate = parseDate(dueDateRaw);
    if (!issueDate || !dueDate) {
      return { success: false, message: "日付の形式が正しくありません。" };
    }

    const parsedItems = JSON.parse(itemsRaw) as Array<{
      name: string;
      quantity: number;
      unitPrice: number;
    }>;

    const items = parsedItems
      .map((item) => ({
        name: item.name?.trim() ?? "",
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
      }))
      .filter((item) => item.name && item.quantity > 0 && item.unitPrice >= 0);

    if (items.length === 0) {
      return { success: false, message: "明細を1件以上入力してください。" };
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const taxAmount = Math.round(subtotal * TAX_RATE);
    const totalAmount = subtotal + taxAmount;

    const yyyymm = `${issueDate.getFullYear()}${String(issueDate.getMonth() + 1).padStart(2, "0")}`;
    const latest = await prisma.invoice.findFirst({
      where: {
        userId: userId,
        id: { startsWith: `INV-${yyyymm}-` },
      },
      orderBy: { id: "desc" },
    });

    const latestSeq = latest?.id.split("-")[2];
    const sequence = latestSeq ? Number(latestSeq) + 1 : 1;
    const invoiceId = formatInvoiceId(issueDate, sequence);

    await prisma.invoice.create({
      data: {
        id: invoiceId,
        userId: userId,
        clientId: finalClientId,
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
    redirect("/dashboard/invoices");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : "保存に失敗しました。";
    return { success: false, message };
  }
}

/** 入金消し込み：請求書を支払済にする */
export async function markInvoicePaid(invoiceId: string): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });
    if (!invoice) {
      return { success: false, message: "請求書が見つかりません。" };
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "支払済" },
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath("/reconcile");
    revalidatePath("/dashboard");
    return { success: true, message: "支払済に更新しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "更新に失敗しました。";
    return { success: false, message };
  }
}

const VALID_INVOICE_STATUSES = ["未払い", "支払済", "部分払い"] as const;

/** 請求書のステータスを変更する（編集画面用） */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: string,
): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    if (!VALID_INVOICE_STATUSES.includes(status as (typeof VALID_INVOICE_STATUSES)[number])) {
      return { success: false, message: "無効なステータスです。" };
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });
    if (!invoice) {
      return { success: false, message: "請求書が見つかりません。" };
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status },
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    revalidatePath(`/dashboard/invoices/${invoiceId}/edit`);
    revalidatePath("/reconcile");
    revalidatePath("/dashboard");
    return { success: true, message: "ステータスを更新しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "更新に失敗しました。";
    return { success: false, message };
  }
}

/** 請求書のステータスを一括変更 */
export async function updateInvoiceStatusBulk(
  invoiceIds: string[],
  status: string,
): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    if (!VALID_INVOICE_STATUSES.includes(status as (typeof VALID_INVOICE_STATUSES)[number])) {
      return { success: false, message: "無効なステータスです。" };
    }

    if (invoiceIds.length === 0) {
      return { success: false, message: "請求書を選択してください。" };
    }

    const { count } = await prisma.invoice.updateMany({
      where: { id: { in: invoiceIds }, userId },
      data: { status },
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath("/reconcile");
    revalidatePath("/dashboard");
    return { success: true, message: `${count}件の請求書を「${status}」に更新しました。` };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "更新に失敗しました。";
    return { success: false, message };
  }
}

/** モーダル表示用に請求書の表示データを取得（日付はISO文字列で返す） */
export async function getInvoiceByIdForDisplay(invoiceId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, userId },
      include: {
        client: true,
        items: true,
        user: {
          include: {
            bankAccounts: {
              where: { isDefault: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!invoice) return null;

    const bankAccount = invoice.user.bankAccounts[0] || null;

    return {
      id: invoice.id,
      type: "請求書" as const,
      number: invoice.id,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      client: {
        name: invoice.client.name,
        address: invoice.client.address,
      },
      user: {
        companyName: invoice.user.companyName,
        invoiceRegNumber: invoice.user.invoiceRegNumber,
        email: invoice.user.email,
      },
      bankAccount: bankAccount
        ? {
            bankName: bankAccount.bankName,
            branchName: bankAccount.branchName,
            accountType: bankAccount.accountType,
            accountNumber: bankAccount.accountNumber,
            accountHolder: bankAccount.accountHolder,
          }
        : null,
      items: invoice.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
      })),
    };
  } catch {
    return null;
  }
}

export async function convertQuoteToInvoice(
  quoteId: string,
): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId, userId: userId },
      include: { items: true },
    });

    if (!quote) {
      return { success: false, message: "見積書が見つかりません。" };
    }

    const issueDate = new Date();
    // 支払期限：翌月末
    const dueDate = new Date(
      issueDate.getFullYear(),
      issueDate.getMonth() + 2,
      0,
    );

    const yyyymm = `${issueDate.getFullYear()}${String(
      issueDate.getMonth() + 1,
    ).padStart(2, "0")}`;
    const latest = await prisma.invoice.findFirst({
      where: {
        userId: userId,
        id: { startsWith: `INV-${yyyymm}-` },
      },
      orderBy: { id: "desc" },
    });

    const latestSeq = latest?.id.split("-")[2];
    const sequence = latestSeq ? Number(latestSeq) + 1 : 1;
    const invoiceId = formatInvoiceId(issueDate, sequence);

    const newInvoice = await prisma.invoice.create({
      data: {
        id: invoiceId,
        userId: userId,
        clientId: quote.clientId,
        status: "未払い",
        issueDate,
        dueDate,
        subtotal: quote.subtotal,
        taxAmount: quote.taxAmount,
        totalAmount: quote.totalAmount,
        items: {
          create: quote.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
          })),
        },
      },
    });

    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: "受注" },
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/quotes");
    revalidatePath("/reconcile");
    redirect(`/dashboard/invoices/${newInvoice.id}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : "変換に失敗しました。";
    return { success: false, message };
  }
}

export type BulkConvertResult = SubmitResult & { convertedCount?: number };

export async function convertQuotesToInvoices(
  quoteIds: string[],
): Promise<BulkConvertResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    if (!quoteIds.length) {
      return { success: false, message: "変換する見積書を選択してください。" };
    }

    const issueDate = new Date();
    const dueDate = new Date(
      issueDate.getFullYear(),
      issueDate.getMonth() + 2,
      0,
    );
    const yyyymm = `${issueDate.getFullYear()}${String(
      issueDate.getMonth() + 1,
    ).padStart(2, "0")}`;

    let latest = await prisma.invoice.findFirst({
      where: {
        userId: userId,
        id: { startsWith: `INV-${yyyymm}-` },
      },
      orderBy: { id: "desc" },
    });

    let convertedCount = 0;
    for (const quoteId of quoteIds) {
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId, userId: userId },
        include: { items: true },
      });
      if (!quote) continue;

      const latestSeq = latest?.id.split("-")[2];
      const sequence = latestSeq ? Number(latestSeq) + 1 : 1;
      const invoiceId = formatInvoiceId(issueDate, sequence);

      const newInvoice = await prisma.invoice.create({
        data: {
          id: invoiceId,
          userId: userId,
          clientId: quote.clientId,
          status: "未払い",
          issueDate,
          dueDate,
          subtotal: quote.subtotal,
          taxAmount: quote.taxAmount,
          totalAmount: quote.totalAmount,
          items: {
            create: quote.items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
            })),
          },
        },
      });
      latest = newInvoice;

      await prisma.quote.update({
        where: { id: quoteId },
        data: { status: "受注" },
      });
      convertedCount += 1;
    }

    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/quotes");
    revalidatePath("/reconcile");
    return {
      success: true,
      message: `${convertedCount}件の見積書を請求書に変換しました。`,
      convertedCount,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "一括変換に失敗しました。";
    return { success: false, message };
  }
}
