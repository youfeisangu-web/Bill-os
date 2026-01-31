"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { updateInvoiceStatusBulk } from "@/app/actions/invoice";

const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(
    typeof date === "string" ? new Date(date) : date,
  );

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value);

const STATUS_OPTIONS = [
  { value: "未払い", label: "未払い" },
  { value: "部分払い", label: "部分払い" },
  { value: "支払済", label: "支払済" },
] as const;

type InvoiceRow = {
  id: string;
  issueDate: Date | string;
  totalAmount: number;
  status: string;
  client: { name: string | null } | null;
};

const statusTone: Record<string, string> = {
  未払い: "text-amber-600",
  部分払い: "text-orange-600",
  支払済: "text-emerald-600",
};

export default function InvoicesTableWithBulkStatus({
  invoices,
}: {
  invoices: InvoiceRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [bulkStatus, setBulkStatus] = useState<string>("支払済");

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      'input[name="invoice-select"]',
    );
    checkboxes.forEach((cb) => {
      cb.checked = e.target.checked;
    });
  };

  const getSelectedIds = (): string[] => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      'input[name="invoice-select"]:checked',
    );
    return Array.from(checkboxes).map((cb) => cb.value);
  };

  const handleBulkStatusChange = () => {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert("ステータスを変更する請求書にチェックを入れてください。");
      return;
    }
    if (!confirm(`選択した${ids.length}件の請求書を「${bulkStatus}」に変更しますか？`)) {
      return;
    }
    startTransition(async () => {
      const result = await updateInvoiceStatusBulk(ids, bulkStatus);
      if (!result.success) {
        alert(result.message);
        return;
      }
      alert(result.message);
      router.refresh();
    });
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">請求書一覧</h2>
          <p className="text-sm text-slate-500">
            発行日・金額・ステータスを確認できます。チェックして一括でステータスを変更できます。
          </p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          請求書を作成
        </Link>
      </div>

      {invoices.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-sm font-medium text-slate-700">一括操作：</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleBulkStatusChange}
            disabled={isPending}
            className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {isPending ? "更新中..." : "選択した請求書のステータスを変更"}
          </button>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="w-10 px-4 py-3">
                {invoices.length > 0 ? (
                  <input
                    type="checkbox"
                    aria-label="すべて選択"
                    onChange={handleToggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                ) : null}
              </th>
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
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  まだ請求書が登録されていません。作成ボタンから追加してください。
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="text-slate-700">
                  <td className="px-4 py-4">
                    <input
                      name="invoice-select"
                      type="checkbox"
                      value={invoice.id}
                      aria-label={`${invoice.id} を選択`}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
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
  );
}
