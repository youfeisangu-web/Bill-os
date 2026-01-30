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

export async function createTenant(formData: FormData): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const name = getValue(formData, "name");
    const nameKana = getValue(formData, "nameKana");
    const amountRaw = getValue(formData, "amount");
    const groupId = getValue(formData, "groupId") || null;

    if (!name || !nameKana) {
      return { success: false, message: "契約者名とフリガナを入力してください。" };
    }

    const amount = amountRaw ? parseInt(amountRaw, 10) : 0;
    if (isNaN(amount) || amount <= 0) {
      return { success: false, message: "有効な金額を入力してください。" };
    }

    // groupIdが指定されている場合、存在確認
    if (groupId) {
      const group = await prisma.tenantGroup.findUnique({
        where: { id: groupId },
      });
      if (!group) {
        return { success: false, message: "指定されたフォルダが見つかりません。" };
      }
    }

    await prisma.tenant.create({
      data: {
        name,
        nameKana,
        amount,
        groupId: groupId || null,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, message: "入居者を登録しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存に失敗しました。";
    return { success: false, message };
  }
}

export async function updateTenant(formData: FormData): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const id = getValue(formData, "id");
    const name = getValue(formData, "name");
    const nameKana = getValue(formData, "nameKana");
    const amountRaw = getValue(formData, "amount");
    const groupId = getValue(formData, "groupId") || null;

    if (!id) {
      return { success: false, message: "IDが指定されていません。" };
    }

    if (!name || !nameKana) {
      return { success: false, message: "契約者名とフリガナを入力してください。" };
    }

    const amount = amountRaw ? parseInt(amountRaw, 10) : 0;
    if (isNaN(amount) || amount <= 0) {
      return { success: false, message: "有効な金額を入力してください。" };
    }

    // groupIdが指定されている場合、存在確認
    if (groupId) {
      const group = await prisma.tenantGroup.findUnique({
        where: { id: groupId },
      });
      if (!group) {
        return { success: false, message: "指定されたフォルダが見つかりません。" };
      }
    }

    await prisma.tenant.update({
      where: { id },
      data: {
        name,
        nameKana,
        amount,
        groupId: groupId || null,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, message: "入居者情報を更新しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "更新に失敗しました。";
    return { success: false, message };
  }
}

export async function deleteTenant(id: string): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    if (!id) {
      return { success: false, message: "IDが指定されていません。" };
    }

    await prisma.tenant.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    return { success: true, message: "入居者を削除しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "削除に失敗しました。";
    return { success: false, message };
  }
}

// フォルダIDで入居者を取得
// groupIdがnullの場合はすべての入居者を取得
export async function getTenantsByGroup(groupId: string | null) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    return await prisma.tenant.findMany({
      where: groupId ? { groupId } : undefined,
      orderBy: {
        name: "asc",
      },
    });
  } catch (error) {
    console.error("Error fetching tenants by group:", error);
    return [];
  }
}

/** 請求書の取引先（Client）を入金消し込み用の取引先（Tenant）に取り込む。同名がなければ作成。 */
export async function importClientsAsTenants(): Promise<
  { success: boolean; message: string; importedCount?: number }
> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const clients = await prisma.client.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    if (clients.length === 0) {
      return { success: false, message: "請求書の取引先が1件もありません。" };
    }

    let imported = 0;
    for (const client of clients) {
      const existing = await prisma.tenant.findFirst({
        where: { name: client.name },
      });
      if (!existing) {
        await prisma.tenant.create({
          data: {
            name: client.name,
            nameKana: client.name,
            amount: 0,
          },
        });
        imported += 1;
      }
    }

    revalidatePath("/reconcile");
    revalidatePath("/dashboard/tenants");
    return {
      success: true,
      message: `${imported}件の取引先を入金消し込み用に取り込みました。金額は0のため、ダッシュボードの「入居者」で金額を編集するとマッチしやすくなります。`,
      importedCount: imported,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "取り込みに失敗しました。";
    return { success: false, message };
  }
}
