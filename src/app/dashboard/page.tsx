import OnboardingSuccessAlert from "@/components/onboarding-success-alert";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value);

const statusTone: Record<string, string> = {
  送付済み: "text-slate-600",
  未払い: "text-amber-600",
  支払済: "text-emerald-600",
  入金済み: "text-emerald-600",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const allInvoices = await prisma.invoice.findMany({
    where: { userId: userId },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const allExpenses = await prisma.expense.findMany({
    where: { userId: userId },
    orderBy: { date: "desc" },
  });

  // KPI calculations
  const thisMonthInvoices = allInvoices.filter(
    (inv) => inv.issueDate >= firstDayOfMonth
  );
  const thisMonthSales = thisMonthInvoices.reduce(
    (sum, inv) => sum + inv.totalAmount,
    0
  );

  const thisMonthExpensesData = allExpenses.filter(
    (exp) => exp.date >= firstDayOfMonth
  );
  const thisMonthExpenses = thisMonthExpensesData.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  const profit = thisMonthSales - thisMonthExpenses;

  const unpaidInvoices = allInvoices.filter((inv) => inv.status === "未払い");
  const unpaidAmount = unpaidInvoices.reduce(
    (sum, inv) => sum + inv.totalAmount,
    0
  );
  const unpaidCount = unpaidInvoices.length;

  const kpis = [
    {
      label: "今月の売上",
      value: `¥${formatCurrency(thisMonthSales)}`,
      delta: `先月比: --%`,
      tone: "text-emerald-600",
    },
    {
      label: "未払い",
      value: `¥${formatCurrency(unpaidAmount)}`,
      delta: `${unpaidCount}件の未払い`,
      tone: "text-amber-600",
    },
    {
      label: "経費",
      value: `¥${formatCurrency(thisMonthExpenses)}`,
      delta: `${thisMonthExpensesData.length}件の登録`,
      tone: "text-slate-500",
    },
    {
      label: "粗利",
      value: `¥${formatCurrency(profit)}`,
      delta: "売上 - 経費",
      tone: profit >= 0 ? "text-emerald-600" : "text-rose-600",
    },
  ];

  // Graph data calculation (Last 6 months)
  const monthLabels: string[] = [];
  const graphValues: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = `${d.getMonth() + 1}月`;
    monthLabels.push(monthName);

    const nextM = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthlyTotal = allInvoices
      .filter((inv) => inv.issueDate >= d && inv.issueDate < nextM)
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    graphValues.push(monthlyTotal);
  }

  // Normalize graph values for height (max height 110px)
  const maxVal = Math.max(...graphValues, 1);
  const normalizedHeights = graphValues.map((v) => (v / maxVal) * 110);

  const recentInvoices = allInvoices.slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <OnboardingSuccessAlert />
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            概況
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">ホーム</h1>
        </div>
        <p className="text-sm text-slate-600">
          登録された請求書データに基づいて数値を表示しています。
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {kpi.label}
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              {kpi.value}
            </p>
            <p className={`text-xs ${kpi.tone}`}>{kpi.delta}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">売上グラフ</h2>
            <span className="text-xs text-slate-400">過去6か月</span>
          </div>
          <div className="relative h-56 rounded-2xl border border-slate-200 bg-slate-50">
            <div className="absolute inset-x-6 bottom-6 flex h-28 items-end gap-3">
              {normalizedHeights.map((height, idx) => (
                <div
                  key={idx}
                  style={{ height: `${height}px` }}
                  className="w-10 rounded-xl bg-gradient-to-t from-blue-600 to-blue-300 shadow-[0_8px_20px_rgba(37,99,235,0.25)]"
                />
              ))}
            </div>
            <div className="absolute inset-x-6 top-6 flex items-center justify-between text-xs text-slate-400">
              {monthLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">最近の請求書</h2>
          <div className="flex flex-col gap-3 text-sm">
            {recentInvoices.length === 0 ? (
              <p className="py-10 text-center text-slate-400">データがありません</p>
            ) : (
              recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">{invoice.id}</span>
                    <span className="font-medium text-slate-900">
                      {invoice.client?.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-slate-900">
                      ¥{formatCurrency(invoice.totalAmount)}
                    </span>
                    <span
                      className={`text-xs ${
                        statusTone[invoice.status] ?? "text-slate-500"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
