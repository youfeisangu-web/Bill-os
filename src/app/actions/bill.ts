"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type SubmitResult = {
  success: boolean;
  message: string;
};

export async function getBills() {
  const { userId } = await auth();
  if (!userId) return [];

  return prisma.bill.findMany({
    where: { userId },
    orderBy: { dueDate: "asc" },
  });
}

export async function createBill(formData: FormData): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const vendorName = formData.get("vendorName") as string;
    const title = formData.get("title") as string;
    const amount = Number(formData.get("amount"));
    const issueDateRaw = formData.get("issueDate") as string;
    const dueDateRaw = formData.get("dueDate") as string;
    const memo = (formData.get("memo") as string) || null;

    if (!vendorName || !title || !amount || !issueDateRaw || !dueDateRaw) {
      return { success: false, message: "必須項目を入力してください。" };
    }

    await prisma.bill.create({
      data: {
        userId,
        vendorName,
        title,
        amount,
        issueDate: new Date(`${issueDateRaw}T00:00:00`),
        dueDate: new Date(`${dueDateRaw}T00:00:00`),
        memo,
      },
    });

    revalidatePath("/dashboard/bills");
    revalidatePath("/dashboard");
    return { success: true, message: "請求書を登録しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存に失敗しました。";
    return { success: false, message };
  }
}

export async function updateBill(
  id: string,
  formData: FormData,
): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const vendorName = formData.get("vendorName") as string;
    const title = formData.get("title") as string;
    const amount = Number(formData.get("amount"));
    const issueDateRaw = formData.get("issueDate") as string;
    const dueDateRaw = formData.get("dueDate") as string;
    const memo = (formData.get("memo") as string) || null;

    if (!vendorName || !title || !amount || !issueDateRaw || !dueDateRaw) {
      return { success: false, message: "必須項目を入力してください。" };
    }

    await prisma.bill.update({
      where: { id, userId },
      data: {
        vendorName,
        title,
        amount,
        issueDate: new Date(`${issueDateRaw}T00:00:00`),
        dueDate: new Date(`${dueDateRaw}T00:00:00`),
        memo,
      },
    });

    revalidatePath("/dashboard/bills");
    revalidatePath("/dashboard");
    return { success: true, message: "請求書を更新しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "更新に失敗しました。";
    return { success: false, message };
  }
}

export async function deleteBill(id: string): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await prisma.bill.delete({ where: { id, userId } });

    revalidatePath("/dashboard/bills");
    revalidatePath("/dashboard");
    return { success: true, message: "削除しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "削除に失敗しました。";
    return { success: false, message };
  }
}

export async function markBillAsPaid(
  id: string,
  paidDateRaw: string,
  category: string,
): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const bill = await prisma.bill.findUnique({ where: { id, userId } });
    if (!bill) return { success: false, message: "請求書が見つかりません。" };
    if (bill.status === "PAID")
      return { success: false, message: "すでに支払済です。" };

    const paidDate = new Date(`${paidDateRaw}T00:00:00`);

    // 経費レコードを作成
    const expense = await prisma.expense.create({
      data: {
        userId,
        title: `${bill.vendorName} / ${bill.title}`,
        amount: bill.amount,
        date: paidDate,
        category,
      },
    });

    // 請求書を支払済に更新し、経費と紐付け
    await prisma.bill.update({
      where: { id },
      data: {
        status: "PAID",
        paidDate,
        category,
        expenseId: expense.id,
      },
    });

    revalidatePath("/dashboard/bills");
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard");
    return { success: true, message: "支払済にしました。経費にも自動登録しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "処理に失敗しました。";
    return { success: false, message };
  }
}
