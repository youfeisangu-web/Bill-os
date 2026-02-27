"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type SubmitResult = {
  success: boolean;
  message: string;
};

type RecurringTemplateItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
};

/**
 * TenantからClientを自動作成または取得
 */
async function getOrCreateClientFromTenant(
  userId: string,
  tenantId: string
): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new Error("取引先が見つかりません");
  }

  // 既存のClientを検索（名前で一致するもの）
  let client = await prisma.client.findFirst({
    where: {
      userId,
      name: tenant.name,
    },
  });

  // 存在しない場合は作成
  if (!client) {
    client = await prisma.client.create({
      data: {
        userId,
        name: tenant.name,
        email: null,
        address: null,
      },
    });
  }

  return client.id;
}

/**
 * 定期請求テンプレートを作成
 */
export async function createRecurringTemplate(
  formData: FormData
): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const tenantId = formData.get("tenantId") as string;
    const interval = formData.get("interval") as string || "MONTHLY";
    const creationDay = parseInt(formData.get("creationDay") as string);
    const sendDay = formData.get("sendDay")
      ? parseInt(formData.get("sendDay") as string)
      : null;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string || null;
    const itemsStr = formData.get("items") as string;
    const note = formData.get("note") as string || null;

    if (!tenantId || !creationDay || !startDateStr || !itemsStr) {
      return { success: false, message: "必須項目を入力してください" };
    }

    // 日付の検証
    if (creationDay < 1 || creationDay > 31) {
      return { success: false, message: "作成日は1-31の範囲で指定してください" };
    }

    if (sendDay && (sendDay < 1 || sendDay > 31)) {
      return { success: false, message: "送信日は1-31の範囲で指定してください" };
    }

    // TenantからClientを自動作成または取得
    const clientId = await getOrCreateClientFromTenant(userId, tenantId);

    // 開始日と終了日をパース
    const startDate = new Date(startDateStr);
    const endDate = endDateStr ? new Date(endDateStr) : null;

    // 次回実行日を計算（開始日が今日より前の場合は、今月または来月の作成日に設定）
    const now = new Date();
    let nextExecutionDate = new Date(startDate);
    
    if (nextExecutionDate < now) {
      // 開始日が過去の場合は、今月または来月の作成日に設定
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const candidateDate = new Date(currentYear, currentMonth, creationDay);
      
      if (candidateDate < now) {
        // 今月の作成日が過ぎている場合は来月
        nextExecutionDate = new Date(currentYear, currentMonth + 1, creationDay);
      } else {
        nextExecutionDate = candidateDate;
      }
    }

    // 明細をパース
    const items: RecurringTemplateItem[] = JSON.parse(itemsStr);
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, message: "明細を1件以上入力してください" };
    }

    // 定期請求テンプレートを作成
    await prisma.recurringTemplate.create({
      data: {
        tenantId,
        clientId,
        interval,
        creationDay,
        sendDay,
        isActive: true,
        startDate,
        endDate,
        nextExecutionDate,
        items: JSON.stringify(items),
        note,
      },
    });

    revalidatePath("/dashboard/recurring");
    revalidatePath("/dashboard/tenants");

    return { success: true, message: "定期請求テンプレートを作成しました" };
  } catch (error) {
    console.error("Error creating recurring template:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "エラーが発生しました",
    };
  }
}

/**
 * 定期請求テンプレートを更新
 */
export async function updateRecurringTemplate(
  templateId: string,
  formData: FormData
): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const interval = formData.get("interval") as string || "MONTHLY";
    const creationDay = parseInt(formData.get("creationDay") as string);
    const sendDay = formData.get("sendDay")
      ? parseInt(formData.get("sendDay") as string)
      : null;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string || null;
    const itemsStr = formData.get("items") as string;
    const note = formData.get("note") as string || null;
    const isActive = formData.get("isActive") === "true";

    if (!creationDay || !startDateStr || !itemsStr) {
      return { success: false, message: "必須項目を入力してください" };
    }

    // 日付の検証
    if (creationDay < 1 || creationDay > 31) {
      return { success: false, message: "作成日は1-31の範囲で指定してください" };
    }

    if (sendDay && (sendDay < 1 || sendDay > 31)) {
      return { success: false, message: "送信日は1-31の範囲で指定してください" };
    }

    // テンプレートを取得
    const template = await prisma.recurringTemplate.findUnique({
      where: { id: templateId },
      include: { tenant: true },
    });

    if (!template) {
      return { success: false, message: "テンプレートが見つかりません" };
    }

    // 開始日と終了日をパース
    const startDate = new Date(startDateStr);
    const endDate = endDateStr ? new Date(endDateStr) : null;

    // 次回実行日を再計算
    const now = new Date();
    let nextExecutionDate = new Date(startDate);
    
    if (nextExecutionDate < now) {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const candidateDate = new Date(currentYear, currentMonth, creationDay);
      
      if (candidateDate < now) {
        nextExecutionDate = new Date(currentYear, currentMonth + 1, creationDay);
      } else {
        nextExecutionDate = candidateDate;
      }
    }

    // 明細をパース
    const items: RecurringTemplateItem[] = JSON.parse(itemsStr);
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, message: "明細を1件以上入力してください" };
    }

    // 更新
    await prisma.recurringTemplate.update({
      where: { id: templateId },
      data: {
        interval,
        creationDay,
        sendDay,
        isActive,
        startDate,
        endDate,
        nextExecutionDate,
        items: JSON.stringify(items),
        note,
      },
    });

    revalidatePath("/dashboard/recurring");
    revalidatePath("/dashboard/tenants");

    return { success: true, message: "定期請求テンプレートを更新しました" };
  } catch (error) {
    console.error("Error updating recurring template:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "エラーが発生しました",
    };
  }
}

/**
 * 定期請求テンプレートを削除
 */
export async function deleteRecurringTemplate(
  templateId: string
): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await prisma.recurringTemplate.delete({
      where: { id: templateId },
    });

    revalidatePath("/dashboard/recurring");
    revalidatePath("/dashboard/tenants");

    return { success: true, message: "定期請求テンプレートを削除しました" };
  } catch (error) {
    console.error("Error deleting recurring template:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "エラーが発生しました",
    };
  }
}

/**
 * 定期請求テンプレートの有効/無効を切り替え
 */
export async function toggleRecurringTemplate(
  templateId: string,
  isActive: boolean
): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await prisma.recurringTemplate.update({
      where: { id: templateId },
      data: { isActive },
    });

    revalidatePath("/dashboard/recurring");
    revalidatePath("/dashboard/tenants");

    return {
      success: true,
      message: isActive
        ? "定期請求テンプレートを有効化しました"
        : "定期請求テンプレートを無効化しました",
    };
  } catch (error) {
    console.error("Error toggling recurring template:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "エラーが発生しました",
    };
  }
}

/**
 * 定期請求テンプレート一覧を取得
 */
export async function getRecurringTemplates(tenantId?: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const templates = await prisma.recurringTemplate.findMany({
      where: {
        tenant: {
          // tenantIdでフィルタリング（指定された場合）
          ...(tenantId ? { id: tenantId } : {}),
        },
      },
      include: {
        tenant: true,
        client: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return templates.map((template) => ({
      ...template,
      items: JSON.parse(template.items) as RecurringTemplateItem[],
    }));
  } catch (error) {
    console.error("Error getting recurring templates:", error);
    return [];
  }
}

/**
 * 特定のテナントの定期請求テンプレートを取得
 */
export async function getRecurringTemplateById(templateId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const template = await prisma.recurringTemplate.findUnique({
      where: { id: templateId },
      include: {
        tenant: true,
        client: true,
      },
    });

    if (!template) {
      return null;
    }

    return {
      ...template,
      items: JSON.parse(template.items) as RecurringTemplateItem[],
    };
  } catch (error) {
    console.error("Error getting recurring template:", error);
    return null;
  }
}

/** 今月に定期請求で作成された請求書一覧（送付用） */
export async function getRecurringGeneratedInvoicesThisMonth() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        recurringTemplateId: { not: null },
        issueDate: { gte: startOfMonth },
      },
      orderBy: { issueDate: "desc" },
      include: { client: { select: { name: true, email: true } } },
    });

    return invoices.map((inv) => ({
      id: inv.id,
      issueDate: inv.issueDate.toISOString().slice(0, 10),
      totalAmount: inv.totalAmount,
      clientName: inv.client.name,
      clientEmail: inv.client.email ?? "",
    }));
  } catch (error) {
    console.error("Error getting recurring invoices:", error);
    return [];
  }
}
