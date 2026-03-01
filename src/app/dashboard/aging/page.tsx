import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAgingReport, type AgingBucket } from "@/app/actions/invoice";

const BUCKET_LABELS: Record<AgingBucket, string> = {
  "0-30": "0〜30日",
  "31-60": "31〜60日",
  "61-90": "61〜90日",
  "90超": "90日超",
};

const BUCKET_ORDER: AgingBucket[] = ["0-30", "31-60", "61-90", "90超"];

export default async function AgingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const rows = await getAgingReport();

  const byBucket = BUCKET_ORDER.map((bucket) => ({
    bucket,
    label: BUCKET_LABELS[bucket],
    items: rows.filter((r) => r.bucket === bucket),
    total: rows
      .filter((r) => r.bucket === bucket)
      .reduce((sum, r) => sum + r.totalAmount, 0),
  }));

  const grandTotal = rows.reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <div className="flex flex-col gap-5 py-5 md:gap-8 md:py-8">
      <header className="flex flex-col gap-1">
        <p className="billia-label">未収管理</p>
        <h1 className="text-xl font-semibold tracking-tight text-billia-text md:text-2xl">
          エイジングレポート
        </h1>
        <p className="text-xs text-billia-text-muted hidden md:block">
          未払い・部分払いの請求を支払期限経過日数で集計しています。
        </p>
      </header>

      <div className="billia-card overflow-hidden p-4 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 md:gap-4 md:mb-6">
          {byBucket.map(({ bucket, label, total }) => (
            <div
              key={bucket}
              className="rounded-xl border border-black/[0.06] bg-white p-3 md:p-4"
            >
              <p className="text-[11px] text-billia-text-muted mb-1 md:text-xs">{label}</p>
              <p className="text-base font-semibold text-billia-text md:text-xl">
                ¥{total.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs font-medium text-billia-text mb-3 md:text-sm md:mb-2">
          合計未収: ¥{grandTotal.toLocaleString()}
        </p>

        {rows.length === 0 ? (
          <p className="text-center text-billia-text-muted py-8 text-sm">
            未払い・部分払いの請求はありません。
          </p>
        ) : (
          <>
            {/* モバイル: カード表示 */}
            <div className="space-y-2 md:hidden">
              {rows.map((r) => (
                <Link
                  key={r.id}
                  href={`/dashboard/invoices/${r.id}`}
                  className="block rounded-xl border border-black/[0.06] bg-white p-3 hover:bg-billia-bg transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-billia-text truncate">{r.clientName}</p>
                      <p className="text-xs text-billia-blue">{r.id}</p>
                    </div>
                    <p className="text-sm font-semibold text-billia-text shrink-0">¥{r.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-billia-text-muted">
                    <span>期限: {r.dueDate}</span>
                    {r.daysOverdue > 0 && <span className="text-red-500 font-medium">{r.daysOverdue}日超過</span>}
                    <span className="ml-auto">{BUCKET_LABELS[r.bucket]}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* デスクトップ: テーブル表示 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-billia-text-muted">
                    <th className="py-3 px-2">取引先</th>
                    <th className="py-3 px-2">請求書番号</th>
                    <th className="py-3 px-2">発行日</th>
                    <th className="py-3 px-2">支払期限</th>
                    <th className="py-3 px-2">経過日数</th>
                    <th className="py-3 px-2">区分</th>
                    <th className="py-3 px-2 text-right">金額</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-black/[0.06]">
                      <td className="py-3 px-2">{r.clientName}</td>
                      <td className="py-3 px-2">
                        <Link href={`/dashboard/invoices/${r.id}`} className="text-billia-blue hover:underline">{r.id}</Link>
                      </td>
                      <td className="py-3 px-2">{r.issueDate}</td>
                      <td className="py-3 px-2">{r.dueDate}</td>
                      <td className="py-3 px-2">{r.daysOverdue}日</td>
                      <td className="py-3 px-2">{BUCKET_LABELS[r.bucket]}</td>
                      <td className="py-3 px-2 text-right font-medium">¥{r.totalAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
