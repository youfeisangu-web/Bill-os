"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type SubmitResult = {
  success: boolean;
  message: string;
};

/**
 * 月次入金台帳のステータスを取得または作成
 * @param tenantId 取引先ID
 * @param targetMonth "2026-01" 形式の月
 */
export async function getOrCreatePaymentStatus(
  tenantId: string,
  targetMonth: string
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // 取引先情報を取得（月額請求額を取得するため）
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error("取引先が見つかりません");
    }

    // 既存のステータスを確認
    let status = await prisma.paymentStatus.findFirst({
      where: {
        tenantId,
        targetMonth,
      },
      include: {
        payments: true,
      },
    });

    // 存在しない場合は作成
    if (!status) {
      // その月の支払い総額を計算
      const monthStart = new Date(targetMonth + "-01");
      const monthEnd = new Date(
        new Date(monthStart).setMonth(monthStart.getMonth() + 1)
      );

      const monthPayments = await prisma.payment.findMany({
        where: {
          tenantId,
          date: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
      });

      const paidAmount = monthPayments.reduce(
        (sum, p) => sum + p.amount,
        0
      );

      // ステータスを決定
      let paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
      if (paidAmount >= tenant.amount) {
        paymentStatus = "PAID";
      } else if (paidAmount === 0) {
        paymentStatus = "UNPAID";
      } else {
        paymentStatus = "PARTIAL";
      }

      status = await prisma.paymentStatus.create({
        data: {
          tenantId,
          targetMonth,
          status: paymentStatus,
          expectedAmount: tenant.amount,
          paidAmount,
        },
        include: {
          payments: true,
        },
      });
    }

    return status;
  } catch (error) {
    console.error("Error getting payment status:", error);
    throw error;
  }
}

/**
 * 取引先の月次入金台帳一覧を取得
 * @param tenantId 取引先ID
 */
export async function getPaymentStatusesByTenant(tenantId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    return await prisma.paymentStatus.findMany({
      where: { tenantId },
      include: {
        payments: {
          orderBy: {
            date: "desc",
          },
        },
      },
      orderBy: {
        targetMonth: "desc",
      },
    });
  } catch (error) {
    console.error("Error fetching payment statuses:", error);
    return [];
  }
}

/**
 * プロジェクト内の全取引先の月次入金台帳を取得
 * @param groupId プロジェクトID（nullの場合は全取引先）
 */
export async function getPaymentStatusesByGroup(groupId: string | null) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const tenants = await prisma.tenant.findMany({
      where: groupId ? { groupId } : undefined,
      select: { id: true },
    });

    const tenantIds = tenants.map((t) => t.id);

    return await prisma.paymentStatus.findMany({
      where: {
        tenantId: {
          in: tenantIds,
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            nameKana: true,
            amount: true,
          },
        },
        payments: {
          orderBy: {
            date: "desc",
          },
        },
      },
      orderBy: [
        { targetMonth: "desc" },
        { tenant: { name: "asc" } },
      ],
    });
  } catch (error) {
    console.error("Error fetching payment statuses by group:", error);
    return [];
  }
}

/**
 * 支払いを登録し、月次ステータスを更新
 * @param tenantId 取引先ID
 * @param amount 金額
 * @param dateStr 日付（ISO文字列）
 * @param targetMonth 対象月（"2026-01"形式、オプショナル）
 */
export async function createPaymentWithStatus(
  tenantId: string,
  amount: number,
  dateStr: string,
  targetMonth?: string
): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const date = new Date(dateStr);
    
    // targetMonthが指定されていない場合は、日付から自動判定
    const month = targetMonth || `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    // 取引先情報を取得
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return { success: false, message: "取引先が見つかりません" };
    }

    // 月次ステータスを取得または作成
    let paymentStatus = await prisma.paymentStatus.findFirst({
      where: {
        tenantId,
        targetMonth: month,
      },
    });

    if (!paymentStatus) {
      paymentStatus = await prisma.paymentStatus.create({
        data: {
          tenantId,
          targetMonth: month,
          status: "UNPAID",
          expectedAmount: tenant.amount,
          paidAmount: 0,
        },
      });
    }

    // 支払いを登録
    await prisma.payment.create({
      data: {
        tenantId,
        amount,
        date,
        note: `${month}分`,
        paymentStatusId: paymentStatus.id,
      },
    });

    // 月次ステータスを更新
    const updatedPaidAmount = paymentStatus.paidAmount + amount;
    let newStatus: "PAID" | "UNPAID" | "PARTIAL";
    if (updatedPaidAmount >= tenant.amount) {
      newStatus = "PAID";
    } else if (updatedPaidAmount === 0) {
      newStatus = "UNPAID";
    } else {
      newStatus = "PARTIAL";
    }

    await prisma.paymentStatus.update({
      where: { id: paymentStatus.id },
      data: {
        paidAmount: updatedPaidAmount,
        status: newStatus,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/ledger");
    return { success: true, message: "入金を登録しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "登録に失敗しました。";
    return { success: false, message };
  }
}

/**
 * 月次ステータスを手動で更新（未払い→部分払い→支払済み）
 */
export async function updatePaymentStatus(
  id: string,
  status: "PAID" | "UNPAID" | "PARTIAL"
): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await prisma.paymentStatus.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/dashboard/ledger");
    return { success: true, message: "ステータスを更新しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "更新に失敗しました。";
    return { success: false, message };
  }
}
