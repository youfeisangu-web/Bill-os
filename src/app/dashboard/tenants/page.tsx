import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTenantGroups } from "@/app/actions/tenant-group";
import { getTenantsByGroup } from "@/app/actions/tenant";
import { getPaymentStatusesByGroup } from "@/app/actions/payment-status";
import { prisma } from "@/lib/prisma";
import TenantsClientView from "./tenants-client-view";

type Props = {
  searchParams: Promise<{ groupId?: string }>;
};

export default async function TenantsPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const params = await searchParams;
  const selectedGroupId = params.groupId || null;

  // フォルダ一覧を取得
  const groups = await getTenantGroups();

  // 入居者一覧を取得（groupIdで絞り込み）
  const tenants = await getTenantsByGroup(selectedGroupId);

  // 現在の日付を取得
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 今月のPaymentStatusを取得
  const currentMonthStatuses = await getPaymentStatusesByGroup(selectedGroupId);
  const filteredCurrentMonth = currentMonthStatuses.filter(
    (ps) => ps.targetMonth === currentMonth
  );

  // 統計情報を計算
  // 1. 今月の集金金額（入金済みの合計）
  const collectedAmount = filteredCurrentMonth
    .filter((ps) => ps.status === "PAID" || ps.status === "PARTIAL")
    .reduce((sum, ps) => sum + ps.paidAmount, 0);

  // 2. 未収金額（未払い・部分払いの残額）
  const unpaidAmount = filteredCurrentMonth
    .filter((ps) => ps.status === "UNPAID" || ps.status === "PARTIAL")
    .reduce((sum, ps) => sum + (ps.expectedAmount - ps.paidAmount), 0);

  // 3. 期限すぎ件数（過去の月で未払い・部分払いの件数）
  const overdueCount = currentMonthStatuses.filter((ps) => {
    const [year, month] = ps.targetMonth.split("-").map(Number);
    const targetDate = new Date(year, month - 1, 1);
    const targetMonthEnd = new Date(year, month, 0); // その月の最終日
    
    // その月の最終日を過ぎていて、かつ未払いまたは部分払いの場合
    return (
      targetMonthEnd < now &&
      (ps.status === "UNPAID" || ps.status === "PARTIAL")
    );
  }).length;

  return (
    <TenantsClientView
      groups={groups}
      tenants={tenants}
      selectedGroupId={selectedGroupId}
      currentMonth={currentMonth}
      collectedAmount={collectedAmount}
      unpaidAmount={unpaidAmount}
      overdueCount={overdueCount}
    />
  );
}
