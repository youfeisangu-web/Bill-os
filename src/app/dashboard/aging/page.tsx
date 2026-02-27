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
    <div className="flex flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <p className="billia-label">未収管理</p>
        <h1 className="text-2xl font-semibold tracking-tight text-billia-text">
          エイジングレポート
        </h1>
        <p className="text-sm text-billia-text-muted mt-1">
          未払い・部分払いの請求を支払期限経過日数で集計しています。
        </p>
      </header>

      <div className="billia-card overflow-hidden p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {byBucket.map(({ bucket, label, total }) => (
            <div
              key={bucket}
              className="rounded-xl border border-black/[0.06] bg-white p-4"
            >
              <p className="text-xs text-billia-text-muted mb-1">{label}</p>
              <p className="text-xl font-semibold text-billia-text">
                ¥{total.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm font-medium text-billia-text mb-2">
          合計未収: ¥{grandTotal.toLocaleString()}
        </p>

        <div className="overflow-x-auto">
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
                    <Link
                      href={`/dashboard/invoices/${r.id}`}
                      className="text-billia-blue hover:underline"
                    >
                      {r.id}
                    </Link>
                  </td>
                  <td className="py-3 px-2">{r.issueDate}</td>
                  <td className="py-3 px-2">{r.dueDate}</td>
                  <td className="py-3 px-2">{r.daysOverdue}日</td>
                  <td className="py-3 px-2">{BUCKET_LABELS[r.bucket]}</td>
                  <td className="py-3 px-2 text-right font-medium">
                    ¥{r.totalAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="text-center text-billia-text-muted py-8">
            未払い・部分払いの請求はありません。
          </p>
        )}
      </div>
    </div>
  );
}
