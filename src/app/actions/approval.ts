"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ApprovalResult = { success: boolean; message: string };

async function getRole(userId: string): Promise<string> {
  const profile = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return profile?.role ?? "USER";
}

/** 承認申請（誰でも実行可能・チーム時のみ有効） */
export async function requestApproval(
  type: "invoice" | "quote",
  id: string
): Promise<ApprovalResult> {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { success: false, message: "チーム利用時のみ使用できます" };

  if (type === "invoice") {
    await prisma.invoice.updateMany({
      where: { id, orgId },
      data: { approvalStatus: "PENDING", rejectionNote: null },
    });
    revalidatePath(`/dashboard/invoices/${id}`);
  } else {
    await prisma.quote.updateMany({
      where: { id, orgId },
      data: { approvalStatus: "PENDING", rejectionNote: null },
    });
    revalidatePath(`/dashboard/quotes/${id}`);
  }

  return { success: true, message: "承認申請しました" };
}

/** 承認（ADMINのみ） */
export async function approveDocument(
  type: "invoice" | "quote",
  id: string
): Promise<ApprovalResult> {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { success: false, message: "チーム利用時のみ使用できます" };

  const role = await getRole(userId);
  if (role !== "ADMIN") return { success: false, message: "管理者のみ承認できます" };

  if (type === "invoice") {
    await prisma.invoice.updateMany({
      where: { id, orgId },
      data: { approvalStatus: "APPROVED", approvedBy: userId, approvedAt: new Date() },
    });
    revalidatePath(`/dashboard/invoices/${id}`);
    revalidatePath("/dashboard/invoices");
  } else {
    await prisma.quote.updateMany({
      where: { id, orgId },
      data: { approvalStatus: "APPROVED", approvedBy: userId, approvedAt: new Date() },
    });
    revalidatePath(`/dashboard/quotes/${id}`);
    revalidatePath("/dashboard/quotes");
  }

  return { success: true, message: "承認しました" };
}

/** 却下（ADMINのみ） */
export async function rejectDocument(
  type: "invoice" | "quote",
  id: string,
  note: string
): Promise<ApprovalResult> {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { success: false, message: "チーム利用時のみ使用できます" };

  const role = await getRole(userId);
  if (role !== "ADMIN") return { success: false, message: "管理者のみ却下できます" };

  if (type === "invoice") {
    await prisma.invoice.updateMany({
      where: { id, orgId },
      data: { approvalStatus: "REJECTED", approvedBy: null, approvedAt: null, rejectionNote: note },
    });
    revalidatePath(`/dashboard/invoices/${id}`);
  } else {
    await prisma.quote.updateMany({
      where: { id, orgId },
      data: { approvalStatus: "REJECTED", approvedBy: null, approvedAt: null, rejectionNote: note },
    });
    revalidatePath(`/dashboard/quotes/${id}`);
  }

  return { success: true, message: "却下しました" };
}

/** 承認待ち件数（ダッシュボード用） */
export async function getPendingApprovalCount(): Promise<number> {
  const { orgId } = await auth();
  if (!orgId) return 0;

  const [invoiceCount, quoteCount] = await Promise.all([
    prisma.invoice.count({ where: { orgId, approvalStatus: "PENDING" } }),
    prisma.quote.count({ where: { orgId, approvalStatus: "PENDING" } }),
  ]);

  return invoiceCount + quoteCount;
}
