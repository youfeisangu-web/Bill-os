import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getSalesCategories,
  getCategorySalesByMonth,
  getMonthlySalesSummary,
} from "@/app/actions/sales-category";
import { prisma } from "@/lib/prisma";
import HomeClientView from "./home-client-view";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
function getLastMonth() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const now = new Date();
  const currentMonth = getCurrentMonth();
  const lastMonth = getLastMonth();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const lastDayOfCurrent = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    categories,
    { entries },
    monthlySummary,
    invoiceStats,
    lastMonthEntries,
    recentInvoices,
    currentMonthExpenses,
    invoicesForGraph,
    expensesForGraph,
  ] = await Promise.all([
    getSalesCategories(),
    getCategorySalesByMonth(currentMonth),
    getMonthlySalesSummary(12),
    prisma.invoice.aggregate({
      where: { userId },
      _count: true,
    }),
    prisma.categorySalesEntry.findMany({
      where: { userId, month: lastMonth },
      include: { category: true },
    }),
    prisma.invoice.findMany({
      where: { userId },
      orderBy: { issueDate: "desc" },
      take: 100,
      select: {
        id: true,
        issueDate: true,
        totalAmount: true,
        client: { select: { name: true } },
      },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: firstDayOfMonth, lte: lastDayOfMonth } },
    }),
    prisma.invoice.findMany({
      where: { userId, issueDate: { gte: sixMonthsAgo, lte: lastDayOfCurrent } },
      select: { issueDate: true, totalAmount: true },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: sixMonthsAgo, lte: lastDayOfCurrent } },
    }),
  ]);

  const thisMonthTotal = entries.reduce((s, e) => s + e.amount, 0);
  const lastMonthTotal = lastMonthEntries.reduce((s, e) => s + e.amount, 0);
  const growthRate =
    lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : thisMonthTotal > 0
        ? 100
        : 0;

  const totalExpenses = currentMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const currentMonthInvoiceAmount = invoicesForGraph
    .filter((inv) => {
      const invDate = new Date(inv.issueDate);
      return invDate >= firstDayOfMonth && invDate <= lastDayOfMonth;
    })
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const [paid, unpaid] = await Promise.all([
    prisma.invoice.aggregate({
      where: { userId, status: "支払済" },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { userId, status: { in: ["未払い", "部分払い"] } },
      _sum: { totalAmount: true },
    }),
  ]);
  const unpaidAmount = unpaid._sum.totalAmount ?? 0;

  const monthlyData: Array<{
    month: string;
    invoiceAmount: number;
    quoteAmount: number;
    paidAmount: number;
    expenseAmount: number;
  }> = [];
  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const targetMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    const invoiceAmount = invoicesForGraph
      .filter((inv) => inv.issueDate >= monthStart && inv.issueDate <= monthEnd)
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    const expenseAmount = expensesForGraph
      .filter((e) => e.date >= monthStart && e.date <= monthEnd)
      .reduce((sum, e) => sum + e.amount, 0);
    monthlyData.push({
      month: targetMonth,
      invoiceAmount,
      quoteAmount: 0,
      paidAmount: 0,
      expenseAmount,
    });
  }

  const currentMonthYear = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  return (
    <HomeClientView
      salesProps={{
        initialCategories: categories,
        initialEntries: entries,
        initialMonthlySummary: monthlySummary,
        initialLastMonthEntries: lastMonthEntries,
        recentInvoices: recentInvoices.map((inv) => ({
          id: inv.id,
          issueDate: inv.issueDate.toISOString(),
          totalAmount: inv.totalAmount,
          clientName: inv.client.name,
        })),
        currentMonth,
        kpi: {
          sales: thisMonthTotal,
          customers: invoiceStats._count,
          growthRate,
        },
      }}
      summary={{
        currentMonthInvoiceAmount,
        unpaidAmount,
        totalExpenses,
        currentMonthYear,
      }}
      monthlyData={monthlyData}
    />
  );
}
