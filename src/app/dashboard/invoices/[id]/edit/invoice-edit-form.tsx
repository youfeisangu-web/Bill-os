"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateInvoiceStatus } from "@/app/actions/invoice";

const STATUS_OPTIONS = [
  { value: "未払い", label: "未払い" },
  { value: "部分払い", label: "部分払い" },
  { value: "支払済", label: "支払済" },
] as const;

export default function InvoiceEditForm({
  invoiceId,
  currentStatus,
}: {
  invoiceId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const status = (form.elements.namedItem("status") as HTMLSelectElement)?.value;
    if (!status) return;

    startTransition(async () => {
      const result = await updateInvoiceStatus(invoiceId, status);
      if (result.success) {
        router.push(`/dashboard/invoices/${invoiceId}`);
        router.refresh();
      } else {
        alert(result.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-slate-700">
          ステータス
        </label>
        <select
          id="status"
          name="status"
          defaultValue={currentStatus}
          className="mt-2 block w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "保存中..." : "保存する"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/invoices/${invoiceId}`)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
