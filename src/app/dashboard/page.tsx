import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTenantGroups } from "@/app/actions/tenant-group";
import { getTenantsByGroup } from "@/app/actions/tenant";
import { prisma } from "@/lib/prisma";
import DashboardClientView from "./client-view";

type Props = {
  searchParams: Promise<{ groupId?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const params = await searchParams;
  const selectedGroupId = params.groupId || null;

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const lastDayOfCurrent = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const tenantWhere = selectedGroupId ? { groupId: selectedGroupId } : undefined;

  // 並列で一括取得（待ち時間を短縮）
  const [groups, tenants, currentMonthPaymentsRaw, nextMonthPayments, currentMonthExpenses, unpaidCount, quotesForGraph, paymentsForGraph, expensesForGraph] = await Promise.all([
    getTenantGroups(),
    getTenantsByGroup(selectedGroupId),
    prisma.payment.findMany({
      where: {
        date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
        tenant: tenantWhere,
      },
      include: { tenant: true },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.paymentStatus.findMany({
      where: {
        targetMonth: `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, "0")}`,
        tenant: tenantWhere,
        status: { in: ["PAID", "PARTIAL"] },
      },
      include: { tenant: true },
    }),
    prisma.expense.findMany({
      where: {
        userId,
        date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
      },
    }),
    prisma.paymentStatus.count({
      where: {
        targetMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        tenant: tenantWhere,
        status: { in: ["UNPAID", "PARTIAL"] },
      },
    }),
    prisma.quote.findMany({
      where: {
        userId,
        issueDate: { gte: sixMonthsAgo, lte: lastDayOfCurrent },
      },
    }),
    prisma.payment.findMany({
      where: {
        date: { gte: sixMonthsAgo, lte: lastDayOfCurrent },
        tenant: tenantWhere,
      },
    }),
    prisma.expense.findMany({
      where: {
        userId,
        date: { gte: sixMonthsAgo, lte: lastDayOfCurrent },
      },
    }),
  ]);

  // Date型をシリアライズ可能な形式に変換
  const currentMonthPayments = currentMonthPaymentsRaw.map((payment) => ({
    ...payment,
    date: payment.date.toISOString(),
  }));

  // KPI計算
  const monthlyARR = tenants.reduce((sum, tenant) => sum + tenant.amount, 0);
  const totalPaid = currentMonthPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const unpaidAmount = monthlyARR - totalPaid;
  const paidPercentage =
    monthlyARR > 0 ? Math.round((totalPaid / monthlyARR) * 100) : 0;
  const clientCount = tenants.length;

  // 来月の入金予定額を計算
  const nextMonthExpected = nextMonthPayments.reduce(
    (sum, ps) => sum + ps.paidAmount,
    0
  );

  // 今月の経費合計を計算
  const totalExpenses = currentMonthExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // 現在の日付文字列
  const currentMonthYear = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  // 過去6ヶ月分のデータを集計（一括取得済みのデータを月別に集計）
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const targetMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    const quoteAmount = quotesForGraph
      .filter((q) => q.issueDate >= monthStart && q.issueDate <= monthEnd)
      .reduce((sum, q) => sum + q.totalAmount, 0);
    const paidAmount = paymentsForGraph
      .filter((p) => p.date >= monthStart && p.date <= monthEnd)
      .reduce((sum, p) => sum + p.amount, 0);
    const expenseAmount = expensesForGraph
      .filter((e) => e.date >= monthStart && e.date <= monthEnd)
      .reduce((sum, e) => sum + e.amount, 0);

    monthlyData.push({
      month: targetMonth,
      invoiceAmount: monthlyARR,
      quoteAmount,
      paidAmount,
      expenseAmount,
    });
  }

  return (
    <DashboardClientView
      groups={groups}
      tenants={tenants}
      currentMonthPayments={currentMonthPayments}
      selectedGroupId={selectedGroupId}
      currentMonthYear={currentMonthYear}
      monthlyARR={monthlyARR}
      totalPaid={totalPaid}
      unpaidAmount={unpaidAmount}
      paidPercentage={paidPercentage}
      clientCount={clientCount}
      nextMonthExpected={nextMonthExpected}
      totalExpenses={totalExpenses}
      unpaidCount={unpaidCount}
      monthlyData={monthlyData}
    />
  );
}
