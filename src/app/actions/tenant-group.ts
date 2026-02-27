"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { validateRequired, validateLength, MAX_LENGTHS } from "@/lib/validation";

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

// フォルダを作成
export async function createTenantGroup(formData: FormData): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const name = getValue(formData, "name");

    if (!name) {
      return { success: false, message: "フォルダ名を入力してください。" };
    }

    validateLength(name, MAX_LENGTHS.name, "フォルダ名");

    await prisma.tenantGroup.create({
      data: {
        name,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/reconcile");
    return { success: true, message: "フォルダを作成しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存に失敗しました。";
    return { success: false, message };
  }
}

// フォルダ一覧を取得
export async function getTenantGroups() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    return await prisma.tenantGroup.findMany({
      include: {
        tenants: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  } catch (error) {
    console.error("Error fetching tenant groups:", error);
    return [];
  }
}

// フォルダを削除
export async function deleteTenantGroup(id: string): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    if (!id) {
      return { success: false, message: "IDが指定されていません。" };
    }

    // フォルダに紐づいている取引先がいるかチェック
    const group = await prisma.tenantGroup.findUnique({
      where: { id },
      include: {
        tenants: true,
      },
    });

    if (!group) {
      return { success: false, message: "フォルダが見つかりません。" };
    }

    if (group.tenants.length > 0) {
      // フォルダ内の取引先のgroupIdをnullに設定
      await prisma.tenant.updateMany({
        where: { groupId: id },
        data: { groupId: null },
      });
    }

    await prisma.tenantGroup.delete({
      where: { id },
    });

    revalidatePath("/reconcile");
    return { success: true, message: "フォルダを削除しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "削除に失敗しました。";
    return { success: false, message };
  }
}

// フォルダ名を更新
export async function updateTenantGroup(formData: FormData): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const id = getValue(formData, "id");
    const name = getValue(formData, "name");

    if (!id) {
      return { success: false, message: "IDが指定されていません。" };
    }

    if (!name) {
      return { success: false, message: "フォルダ名を入力してください。" };
    }

    validateLength(name, MAX_LENGTHS.name, "フォルダ名");

    await prisma.tenantGroup.update({
      where: { id },
      data: { name },
    });

    revalidatePath("/reconcile");
    return { success: true, message: "フォルダ名を更新しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "更新に失敗しました。";
    return { success: false, message };
  }
}
