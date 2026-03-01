"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExpense, updateExpense } from "@/app/actions/expense";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categories = [
  "通信費",
  "外注費",
  "消耗品",
  "旅費交通費",
  "地代家賃",
  "広告宣伝費",
  "その他",
];

export type ExpenseInitialValues = {
  title?: string;
  amount?: number;
  date?: string;
  category?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: ExpenseInitialValues | null;
  expenseId?: string;
};

export default function NewExpenseDialog({
  open,
  onOpenChange,
  initialValues,
  expenseId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initialValues?.title ?? "");
      setAmount(
        initialValues?.amount != null ? String(initialValues.amount) : "",
      );
      setDate(initialValues?.date ?? today);
      setCategory(initialValues?.category ?? "");
    }
  }, [open, initialValues]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("title", title);
    formData.set("amount", amount);
    formData.set("date", date);
    formData.set("category", category);
    startTransition(async () => {
      const result = expenseId
        ? await updateExpense(expenseId, formData)
        : await createExpense(formData);
      if (result.success) {
        onOpenChange(false);
        router.refresh();
        window.alert(result.message);
      } else {
        window.alert(result.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {expenseId ? "経費を編集" : "経費を登録"}
          </DialogTitle>
          <DialogDescription>
            支払った経費の情報を入力してください。
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
              件名
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="サーバー代"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                金額
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                日付
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
              カテゴリ
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">選択してください</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "保存中..." : "保存する"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
