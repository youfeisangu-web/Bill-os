"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export type MonthlyFinancial = {
  month: string; // "YYYY-MM"
  income: number;
  expense: number;
  profit: number;
};

export type CategoryExpense = {
  category: string;
  amount: number;
  percentage: number;
};

export type TopClient = {
  name: string;
  total: number;
};

export type UpcomingPayment = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
  dueDate: Date | null;
  status: string;
  isOverdue: boolean;
};

export type FinanceKPI = {
  income: number;
  expense: number;
  profit: number;
  unpaid: number;
};

/** 過去N ヶ月の月次収支 */
export async function getMonthlyFinancials(months = 6): Promise<MonthlyFinancial[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // 2クエリで全期間を一括取得してJS側で月別集計
  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId, issueDate: { gte: startDate, lte: endDate } },
      select: { issueDate: true, totalAmount: true },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      select: { date: true, amount: true },
    }),
  ]);

  const toMonthKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const incomeByMonth = new Map<string, number>();
  const expenseByMonth = new Map<string, number>();

  invoices.forEach((inv) => {
    const key = toMonthKey(inv.issueDate);
    incomeByMonth.set(key, (incomeByMonth.get(key) ?? 0) + inv.totalAmount);
  });
  expenses.forEach((exp) => {
    const key = toMonthKey(exp.date);
    expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + exp.amount);
  });

  const result: MonthlyFinancial[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = toMonthKey(d);
    const income = incomeByMonth.get(month) ?? 0;
    const expense = expenseByMonth.get(month) ?? 0;
    result.push({ month, income, expense, profit: income - expense });
  }
  return result;
}

/** 経費カテゴリ別合計（直近3ヶ月） */
export async function getExpensesByCategory(): Promise<CategoryExpense[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const since = new Date();
  since.setMonth(since.getMonth() - 3);

  const rows = await prisma.expense.groupBy({
    by: ["category"],
    where: { userId, date: { gte: since } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  const total = rows.reduce((s, r) => s + (r._sum.amount ?? 0), 0);

  return rows.map((r) => ({
    category: r.category,
    amount: r._sum.amount ?? 0,
    percentage: total > 0 ? Math.round(((r._sum.amount ?? 0) / total) * 100) : 0,
  }));
}

/** 取引先別売上 TOP N */
export async function getTopClients(limit = 5): Promise<TopClient[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    select: {
      clientId: true,
      client: { select: { name: true } },
      totalAmount: true,
    },
  });

  const map = new Map<string, { name: string; total: number }>();
  invoices.forEach((inv) => {
    const existing = map.get(inv.clientId);
    if (existing) {
      existing.total += inv.totalAmount;
    } else {
      map.set(inv.clientId, { name: inv.client.name, total: inv.totalAmount });
    }
  });

  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map(({ name, total }) => ({ name, total }));
}

/** 未払い請求書の入金予定 */
export async function getUpcomingPayments(): Promise<UpcomingPayment[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const now = new Date();

  const invoices = await prisma.invoice.findMany({
    where: { userId, status: { in: ["未払い", "部分払い"] } },
    select: {
      id: true,
      client: { select: { name: true } },
      totalAmount: true,
      dueDate: true,
      status: true,
    },
    orderBy: { dueDate: "asc" },
    take: 10,
  });

  return invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.id,
    clientName: inv.client.name,
    totalAmount: inv.totalAmount,
    dueDate: inv.dueDate,
    status: inv.status,
    isOverdue: new Date(inv.dueDate) < now,
  }));
}

/** 今月のKPI */
export async function getFinanceKPI(): Promise<FinanceKPI> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [thisInvoices, thisExpenses, unpaidInvoices] = await Promise.all([
    prisma.invoice.aggregate({
      where: { userId, issueDate: { gte: start, lte: end } },
      _sum: { totalAmount: true },
    }),
    prisma.expense.aggregate({
      where: { userId, date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { userId, status: { in: ["未払い", "部分払い"] } },
      _sum: { totalAmount: true },
    }),
  ]);

  const income = thisInvoices._sum.totalAmount ?? 0;
  const expense = thisExpenses._sum.amount ?? 0;
  return { income, expense, profit: income - expense, unpaid: unpaidInvoices._sum.totalAmount ?? 0 };
}
