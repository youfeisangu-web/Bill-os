import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(date);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value);

export default async function QuotesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const quotes = await prisma.quote.findMany({
    where: { userId: userId },
    orderBy: { issueDate: "desc" },
    include: {
      client: {
        select: { name: true },
      },
    },
  });

  const statusTone: Record<string, string> = {
    下書き: "text-slate-500",
    送付済: "text-blue-600",
    受注: "text-emerald-600",
    失注: "text-rose-600",
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
            見積書
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">見積書一覧</h1>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          作成済みの見積書を一覧で管理できます。
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">見積書一覧</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              発行日・有効期限・金額・ステータスを確認できます。
            </p>
          </div>
          <Link
            href="/dashboard/quotes/new"
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            見積書を作成
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">見積番号</th>
                <th className="px-4 py-3">取引先名</th>
                <th className="px-4 py-3">発行日</th>
                <th className="px-4 py-3">有効期限</th>
                <th className="px-4 py-3">金額 (円)</th>
                <th className="px-4 py-3">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {quotes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    まだ見積書が登録されていません。作成ボタンから追加してください。
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-4 py-4 font-medium text-blue-600 dark:text-blue-400">
                      <Link href={`/dashboard/quotes/${quote.id}`}>
                        {quote.quoteNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-4 dark:text-slate-400">{quote.client?.name ?? "-"}</td>
                    <td className="px-4 py-4 dark:text-slate-400">{formatDate(quote.issueDate)}</td>
                    <td className="px-4 py-4 dark:text-slate-400">{formatDate(quote.validUntil)}</td>
                    <td className="px-4 py-4 dark:text-slate-400">
                      ¥{formatCurrency(quote.totalAmount)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`font-medium ${
                          statusTone[quote.status] ?? "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {quote.status}
                      </span>
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
