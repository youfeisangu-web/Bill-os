"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExpense } from "@/app/actions/expense";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const categories = ["通信費", "外注費", "消耗品", "旅費交通費", "地代家賃", "広告宣伝費", "その他"];

export type ExpenseInitialValues = {
  title?: string;
  amount?: number;
  date?: string; // YYYY-MM-DD
  category?: string;
};

export default function NewExpenseDialog({
  open: controlledOpen,
  onOpenChange,
  initialValues,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialValues?: ExpenseInitialValues | null;
} = {}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createExpense(formData);
      if (result.success) {
        setOpen(false);
        event.currentTarget.reset();
        router.refresh();
        window.alert(result.message);
      } else {
        window.alert(result.message);
      }
    });
  };

  const isControlled = onOpenChange !== undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <button className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            経費を登録
          </button>
        </DialogTrigger>
      )}
      <DialogContent key={initialValues ? "prefill" : "empty"}>
        <DialogHeader>
          <DialogTitle>経費を登録</DialogTitle>
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
              name="title"
              type="text"
              required
              placeholder="サーバー代"
              defaultValue={initialValues?.title}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                金額
              </label>
              <input
                name="amount"
                type="number"
                required
                placeholder="1000"
                defaultValue={initialValues?.amount}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                日付
              </label>
              <input
                name="date"
                type="date"
                required
                defaultValue={initialValues?.date ?? new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
              カテゴリ
            </label>
            <select
              name="category"
              required
              defaultValue={initialValues?.category ?? ""}
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
