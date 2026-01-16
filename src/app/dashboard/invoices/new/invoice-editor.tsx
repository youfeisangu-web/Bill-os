"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInvoice } from "@/app/actions/invoice";

type ClientOption = {
  id: string;
  name: string;
};

type ItemRow = {
  name: string;
  quantity: number;
  unitPrice: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value);

export default function InvoiceEditor({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<ItemRow[]>([
    { name: "", quantity: 1, unitPrice: 0 },
  ]);

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const taxAmount = Math.round(subtotal * 0.1);
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  }, [items]);

  const updateItem = (index: number, key: keyof ItemRow, value: string) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (key === "name") {
          return { ...item, name: value };
        }
        const numberValue = Number(value);
        return { ...item, [key]: Number.isNaN(numberValue) ? 0 : numberValue };
      }),
    );
  };

  const handleAddRow = () => {
    setItems((prev) => [...prev, { name: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("items", JSON.stringify(items));

    startTransition(async () => {
      const result = await createInvoice(formData);
      if (!result.success) {
        window.alert(result.message);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">請求書</p>
            <h1 className="text-2xl font-semibold text-slate-900">新規作成</h1>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isPending ? "保存中..." : "保存する"}
          </button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-lg">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
              取引先
            </label>
            <select
              name="clientId"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">選択してください</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {clients.length === 0 && (
              <p className="text-xs text-amber-600">
                取引先が未登録です。先に取引先を登録してください。
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                発行日
              </label>
              <input
                name="issueDate"
                type="date"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                支払期限
              </label>
              <input
                name="dueDate"
                type="date"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">明細</h2>
            <button
              type="button"
              onClick={handleAddRow}
              className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              行を追加
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[2fr_1fr_1fr_auto]"
              >
                <input
                  type="text"
                  placeholder="項目名"
                  value={item.name}
                  onChange={(event) => updateItem(index, "name", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) => updateItem(index, "quantity", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  type="number"
                  min={0}
                  value={item.unitPrice}
                  onChange={(event) => updateItem(index, "unitPrice", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
                  <span>¥{formatCurrency(item.quantity * item.unitPrice)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    disabled={items.length === 1}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 transition hover:bg-white disabled:cursor-not-allowed"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-end gap-2 text-sm text-slate-600">
            <div className="flex w-full max-w-xs items-center justify-between">
              <span>小計</span>
              <span>¥{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex w-full max-w-xs items-center justify-between">
              <span>消費税 (10%)</span>
              <span>¥{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="mt-2 flex w-full max-w-xs items-center justify-between text-base font-semibold text-slate-900">
              <span>合計</span>
              <span className="text-xl">¥{formatCurrency(totals.totalAmount)}</span>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}
