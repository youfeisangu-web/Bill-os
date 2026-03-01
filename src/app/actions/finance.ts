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

  const result: MonthlyFinancial[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const [invoices, expenses] = await Promise.all([
      prisma.invoice.aggregate({
        where: { userId, issueDate: { gte: start, lte: end } },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ]);

    const income = invoices._sum.totalAmount ?? 0;
    const expense = expenses._sum.amount ?? 0;
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
    select: { clientName: true, totalAmount: true },
  });

  const map = new Map<string, number>();
  invoices.forEach((inv) => {
    map.set(inv.clientName, (map.get(inv.clientName) ?? 0) + inv.totalAmount);
  });

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, total]) => ({ name, total }));
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
      invoiceNumber: true,
      clientName: true,
      totalAmount: true,
      dueDate: true,
      status: true,
    },
    orderBy: { dueDate: "asc" },
    take: 10,
  });

  return invoices.map((inv) => ({
    ...inv,
    isOverdue: inv.dueDate ? new Date(inv.dueDate) < now : false,
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
