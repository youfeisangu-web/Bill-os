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
