"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { convertQuotesToInvoices } from "@/app/actions/invoice";
import ImportDocumentButton from "./import-document-button";

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

const statusBg: Record<string, string> = {
  下書き: "bg-slate-50",
  送付済: "bg-blue-50",
  受注: "bg-emerald-50",
  失注: "bg-rose-50",
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
    <div>
      {/* ヘッダー：ボタン群 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <p className="billia-label mb-0.5">一覧</p>
          <p className="text-xs text-billia-text-muted hidden md:block">
            発行日・支払い期限・金額・ステータスを確認できます。チェックして一括で請求書に変換できます。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportDocumentButton />
          {selectableQuotes.length > 0 && (
            <button
              type="button"
              onClick={handleBulkConvert}
              disabled={isPending}
              className="hidden md:inline-flex items-center rounded-xl bg-billia-green px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:opacity-50"
            >
              {isPending ? "変換中..." : "選択した見積を請求書に変換"}
            </button>
          )}
          <Link
            href="/dashboard/quotes/new?tab=memo"
            className="inline-flex rounded-xl border border-billia-blue bg-white px-3 py-2 text-xs font-medium text-billia-blue transition-colors hover:bg-billia-blue/5 md:px-4 md:py-2.5 md:text-sm"
          >
            メモから作成
          </Link>
          <Link
            href="/dashboard/quotes/new"
            className="inline-flex items-center rounded-xl bg-billia-sidebar px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-95 md:px-4 md:py-2.5 md:text-sm"
          >
            見積書を作成
          </Link>
        </div>
      </div>

      {/* モバイル：カード表示 */}
      <div className="mt-4 space-y-2 md:hidden">
        {quotes.length === 0 ? (
          <p className="py-8 text-center text-sm text-billia-text-muted">
            まだ見積書が登録されていません。作成ボタンから追加してください。
          </p>
        ) : (
          quotes.map((quote) => (
            <Link
              key={quote.id}
              href={`/dashboard/quotes/${quote.id}`}
              className="block rounded-xl border border-billia-border-subtle bg-white p-4 hover:bg-billia-bg transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-billia-blue truncate">
                    {quote.quoteNumber}
                  </p>
                  <p className="text-sm text-billia-text mt-0.5 truncate">
                    {quote.client?.name ?? "-"}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium shrink-0 px-2 py-0.5 rounded-full ${statusTone[quote.status] ?? "text-billia-text-muted"} ${statusBg[quote.status] ?? "bg-gray-50"}`}
                >
                  {quote.status}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2.5">
                <p className="text-xs text-billia-text-muted">
                  {formatDate(quote.issueDate)} 〜 {formatDate(quote.validUntil)}
                </p>
                <p className="text-sm font-semibold text-billia-text">
                  ¥{formatCurrency(quote.totalAmount)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* デスクトップ：テーブル表示 */}
      <div className="mt-6 hidden overflow-hidden rounded-xl border border-billia-border-subtle md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-billia-bg billia-label">
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
              <th className="px-4 py-3">有効期限</th>
              <th className="px-4 py-3">金額 (円)</th>
              <th className="px-4 py-3">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-billia-border-subtle">
            {quotes.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-billia-text-muted"
                >
                  まだ見積書が登録されていません。作成ボタンから追加してください。
                </td>
              </tr>
            ) : (
              quotes.map((quote) => {
                const canSelect = quote.status !== "受注";
                return (
                  <tr key={quote.id} className="text-billia-text-muted">
                    <td className="px-4 py-4">
                      {canSelect ? (
                        <input
                          name="quote-select"
                          type="checkbox"
                          value={quote.id}
                          aria-label={`${quote.quoteNumber} を選択`}
                          className="h-4 w-4 rounded border-stone-300 text-billia-green focus:ring-billia-green"
                        />
                      ) : null}
                    </td>
                    <td className="px-4 py-4 font-medium text-billia-blue">
                      <Link href={`/dashboard/quotes/${quote.id}`}>
                        {quote.quoteNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-4">{quote.client?.name ?? "-"}</td>
                    <td className="px-4 py-4">{formatDate(quote.issueDate)}</td>
                    <td className="px-4 py-4">{formatDate(quote.validUntil)}</td>
                    <td className="px-4 py-4">¥{formatCurrency(quote.totalAmount)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`font-medium ${statusTone[quote.status] ?? "text-billia-text-muted"}`}
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
    </div>
  );
}
