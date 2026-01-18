import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import NewExpenseDialog from "./new-expense-dialog";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(date);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value);

export default async function ExpensesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const expenses = await prisma.expense.findMany({
    where: { userId: userId },
    orderBy: { date: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
            経費
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">経費一覧</h1>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          ビジネスで発生した経費を管理できます。
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">登録済み経費</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              日付、件名、カテゴリ、金額を確認できます。
            </p>
          </div>
          <NewExpenseDialog />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">日付</th>
                <th className="px-4 py-3">件名</th>
                <th className="px-4 py-3">カテゴリ</th>
                <th className="px-4 py-3 text-right">金額 (円)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    まだ経費が登録されていません。「経費を登録」から追加してください。
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="text-slate-700 dark:text-slate-300">
                    <td className="px-4 py-4 dark:text-slate-400">{formatDate(expense.date)}</td>
                    <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-50">
                      {expense.title}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right dark:text-slate-400">
                      ¥{formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
