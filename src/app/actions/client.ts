"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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

export async function createClient(formData: FormData): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const name = getValue(formData, "name");
    const email = getValue(formData, "email");
    const address = getValue(formData, "address");

    if (!name) {
      return { success: false, message: "取引先名を入力してください。" };
    }

    await prisma.client.create({
      data: {
        userId: userId,
        name,
        email: email || null,
        address: address || null,
      },
    });

    revalidatePath("/dashboard/clients");
    return { success: true, message: "取引先を登録しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存に失敗しました。";
    return { success: false, message };
  }
}

export async function updateClient(formData: FormData): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const id = getValue(formData, "id");
    const name = getValue(formData, "name");
    const email = getValue(formData, "email");
    const address = getValue(formData, "address");

    if (!id) {
      return { success: false, message: "IDが指定されていません。" };
    }

    if (!name) {
      return { success: false, message: "取引先名を入力してください。" };
    }

    // 取引先が存在し、ユーザーが所有しているか確認
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient || existingClient.userId !== userId) {
      return { success: false, message: "取引先が見つかりません。" };
    }

    await prisma.client.update({
      where: { id },
      data: {
        name,
        email: email || null,
        address: address || null,
      },
    });

    revalidatePath("/dashboard/clients");
    return { success: true, message: "取引先情報を更新しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "更新に失敗しました。";
    return { success: false, message };
  }
}

export async function deleteClient(id: string): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    if (!id) {
      return { success: false, message: "IDが指定されていません。" };
    }

    // 取引先が存在し、ユーザーが所有しているか確認
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient || existingClient.userId !== userId) {
      return { success: false, message: "取引先が見つかりません。" };
    }

    await prisma.client.delete({
      where: { id },
    });

    revalidatePath("/dashboard/clients");
    return { success: true, message: "取引先を削除しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "削除に失敗しました。";
    return { success: false, message };
  }
}
