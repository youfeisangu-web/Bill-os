"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calcTaxAmount, type TaxRounding } from "@/lib/utils";

type SubmitResult = {
  success: boolean;
  message: string;
};

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

const formatQuoteId = (date: Date, sequence: number) => {
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const seq = String(sequence).padStart(3, "0");
  return `QTE-${year}${month}-${seq}`;
};

export async function createQuote(formData: FormData): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const clientId = getValue(formData, "clientId");
    const clientName = getValue(formData, "clientName");
    const clientEmail = getValue(formData, "clientEmail");
    const clientAddress = getValue(formData, "clientAddress");
    const issueDateRaw = getValue(formData, "issueDate");
    const validUntilRaw = getValue(formData, "validUntil");
    const itemsRaw = getValue(formData, "items");

    // 新規顧客の場合は clientName が必須
    if (!clientId && !clientName) {
      return { success: false, message: "取引先を選択するか、新規取引先名を入力してください。" };
    }

    if (!issueDateRaw || !validUntilRaw || !itemsRaw) {
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
    const validUntil = parseDate(validUntilRaw);
    if (!issueDate || !validUntil) {
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
    const user = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: { taxRate: true, taxRounding: true },
    });
    const taxRatePercent = user?.taxRate ?? 10;
    const taxRounding = (user?.taxRounding ?? "floor") as TaxRounding;
    const taxAmount = calcTaxAmount(subtotal, taxRatePercent, taxRounding);
    const totalAmount = subtotal + taxAmount;

    const yyyymm = `${issueDate.getFullYear()}${String(issueDate.getMonth() + 1).padStart(2, "0")}`;
    const latest = await prisma.quote.findFirst({
      where: {
        userId: userId,
        quoteNumber: { startsWith: `QTE-${yyyymm}-` },
      },
      orderBy: { quoteNumber: "desc" },
    });

    const latestSeq = latest?.quoteNumber.split("-")[2];
    const sequence = latestSeq ? Number(latestSeq) + 1 : 1;
    const quoteNumber = formatQuoteId(issueDate, sequence);

    await prisma.quote.create({
      data: {
        userId: userId,
        clientId: finalClientId,
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
          })),
        },
      },
    });

    revalidatePath("/dashboard/quotes");
    redirect("/dashboard/quotes");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : "保存に失敗しました。";
    return { success: false, message };
  }
}
