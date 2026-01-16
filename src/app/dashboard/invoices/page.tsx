import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(date);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value);

export default async function InvoicesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const invoices = await prisma.invoice.findMany({
    where: { userId: userId },
    orderBy: { issueDate: "desc" },
    include: {
      client: {
        select: { name: true },
      },
    },
  });

  const statusTone: Record<string, string> = {
    未払い: "text-amber-600",
    支払済: "text-emerald-600",
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">請求書</p>
          <h1 className="text-2xl font-semibold text-slate-900">請求書一覧</h1>
        </div>
        <p className="text-sm text-slate-600">
          登録済みの請求書を一覧で管理できます。
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">請求書一覧</h2>
            <p className="text-sm text-slate-500">
              発行日・金額・ステータスを確認できます。
            </p>
          </div>
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            請求書を作成
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">請求書番号</th>
                <th className="px-4 py-3">取引先名</th>
                <th className="px-4 py-3">発行日</th>
                <th className="px-4 py-3">金額 (円)</th>
                <th className="px-4 py-3">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    まだ請求書が登録されていません。作成ボタンから追加してください。
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="text-slate-700 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-blue-600">
                      <Link href={`/dashboard/invoices/${invoice.id}`}>
                        {invoice.id}
                      </Link>
                    </td>
                    <td className="px-4 py-4">{invoice.client?.name ?? "-"}</td>
                    <td className="px-4 py-4">{formatDate(invoice.issueDate)}</td>
                    <td className="px-4 py-4">
                      ¥{formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`font-medium ${
                          statusTone[invoice.status] ?? "text-slate-600"
                        }`}
                      >
                        {invoice.status}
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
