"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type SubmitResult = {
  success: boolean;
  message: string;
};

export async function getExpenses() {
  const { userId } = await auth();
  if (!userId) return [];

  return prisma.expense.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
}

export async function createExpense(formData: FormData): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const title = formData.get("title") as string;
    const amount = Number(formData.get("amount"));
    const dateRaw = formData.get("date") as string;
    const category = formData.get("category") as string;

    if (!title || !amount || !dateRaw || !category) {
      return { success: false, message: "すべての項目を入力してください。" };
    }

    const date = new Date(`${dateRaw}T00:00:00`);

    await prisma.expense.create({
      data: {
        userId: userId,
        title,
        amount,
        date,
        category,
      },
    });

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard");
    return { success: true, message: "経費を登録しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存に失敗しました。";
    return { success: false, message };
  }
}

export async function updateExpense(
  id: string,
  formData: FormData,
): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const title = formData.get("title") as string;
    const amount = Number(formData.get("amount"));
    const dateRaw = formData.get("date") as string;
    const category = formData.get("category") as string;

    if (!title || !amount || !dateRaw || !category) {
      return { success: false, message: "すべての項目を入力してください。" };
    }

    const date = new Date(`${dateRaw}T00:00:00`);

    await prisma.expense.update({
      where: { id, userId },
      data: { title, amount, date, category },
    });

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard");
    return { success: true, message: "経費を更新しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "更新に失敗しました。";
    return { success: false, message };
  }
}

export async function deleteExpense(id: string): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await prisma.expense.delete({ where: { id, userId } });

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard");
    return { success: true, message: "経費を削除しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "削除に失敗しました。";
    return { success: false, message };
  }
}
