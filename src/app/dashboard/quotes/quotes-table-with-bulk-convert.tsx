"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { convertQuotesToInvoices } from "@/app/actions/invoice";

const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(
    typeof date === "string" ? new Date(date) : date,
  );

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value);

type QuoteRow = {
  id: string;
  quoteNumber: string;
  issueDate: Date | string;
  validUntil: Date | string;
  totalAmount: number;
  status: string;
  client: { name: string | null } | null;
};

const statusTone: Record<string, string> = {
  下書き: "text-slate-500",
  送付済: "text-blue-600",
  受注: "text-emerald-600",
  失注: "text-rose-600",
};

export default function QuotesTableWithBulkConvert({
  quotes,
}: {
  quotes: QuoteRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      'input[name="quote-select"]',
    );
    checkboxes.forEach((cb) => {
      cb.checked = e.target.checked;
    });
  };

  const getSelectedIds = (): string[] => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      'input[name="quote-select"]:checked',
    );
    return Array.from(checkboxes).map((cb) => cb.value);
  };

  const handleBulkConvert = () => {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert("変換する見積書にチェックを入れてください。");
      return;
    }
    if (
      !confirm(
        `選択した${ids.length}件の見積書を請求書に変換しますか？（見積書のステータスは「受注」になります）`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await convertQuotesToInvoices(ids);
      if (!result.success) {
        alert(result.message);
        return;
      }
      alert(result.message);
      router.refresh();
    });
  };

  const selectableQuotes = quotes.filter((q) => q.status !== "受注");

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">見積書一覧</h2>
          <p className="text-sm text-slate-500">
            発行日・支払い期限・金額・ステータスを確認できます。チェックして一括で請求書に変換できます。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectableQuotes.length > 0 && (
            <button
              type="button"
              onClick={handleBulkConvert}
              disabled={isPending}
              className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? "変換中..." : "選択した見積を請求書に変換"}
            </button>
          )}
          <Link
            href="/dashboard/quotes/new"
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            見積書を作成
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="w-10 px-4 py-3">
                {selectableQuotes.length > 0 ? (
                  <input
                    type="checkbox"
                    aria-label="すべて選択"
                    onChange={handleToggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                ) : null}
              </th>
              <th className="px-4 py-3">見積番号</th>
              <th className="px-4 py-3">取引先名</th>
              <th className="px-4 py-3">発行日</th>
              <th className="px-4 py-3">支払い期限</th>
              <th className="px-4 py-3">金額 (円)</th>
              <th className="px-4 py-3">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {quotes.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  まだ見積書が登録されていません。作成ボタンから追加してください。
                </td>
              </tr>
            ) : (
              quotes.map((quote) => {
                const canSelect = quote.status !== "受注";
                return (
                  <tr key={quote.id} className="text-slate-700">
                    <td className="px-4 py-4">
                      {canSelect ? (
                        <input
                          name="quote-select"
                          type="checkbox"
                          value={quote.id}
                          aria-label={`${quote.quoteNumber} を選択`}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      ) : null}
                    </td>
                    <td className="px-4 py-4 font-medium text-blue-600">
                      <Link href={`/dashboard/quotes/${quote.id}`}>
                        {quote.quoteNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-4">{quote.client?.name ?? "-"}</td>
                    <td className="px-4 py-4">{formatDate(quote.issueDate)}</td>
                    <td className="px-4 py-4">{formatDate(quote.validUntil)}</td>
                    <td className="px-4 py-4">
                      ¥{formatCurrency(quote.totalAmount)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`font-medium ${
                          statusTone[quote.status] ?? "text-slate-600"
                        }`}
                      >
                        {quote.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
