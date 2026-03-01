"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBill, updateBill } from "@/app/actions/bill";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type BillFormValues = {
  vendorName?: string;
  title?: string;
  amount?: number;
  issueDate?: string;
  dueDate?: string;
  memo?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: BillFormValues | null;
  billId?: string;
};

export default function NewBillDialog({
  open,
  onOpenChange,
  initialValues,
  billId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().split("T")[0];

  const [vendorName, setVendorName] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(today);
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (open) {
      setVendorName(initialValues?.vendorName ?? "");
      setTitle(initialValues?.title ?? "");
      setAmount(
        initialValues?.amount != null ? String(initialValues.amount) : "",
      );
      setIssueDate(initialValues?.issueDate ?? today);
      setDueDate(initialValues?.dueDate ?? today);
      setMemo(initialValues?.memo ?? "");
    }
  }, [open, initialValues]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("vendorName", vendorName);
    formData.set("title", title);
    formData.set("amount", amount);
    formData.set("issueDate", issueDate);
    formData.set("dueDate", dueDate);
    formData.set("memo", memo);
    startTransition(async () => {
      const result = billId
        ? await updateBill(billId, formData)
        : await createBill(formData);
      if (result.success) {
        onOpenChange(false);
        router.refresh();
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
            {billId ? "請求書を編集" : "受領請求書を登録"}
          </DialogTitle>
          <DialogDescription>
            他社から届いた請求書の情報を入力してください。
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                請求元（会社名）
              </label>
              <input
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="株式会社◯◯"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                件名
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="3月分 サーバー利用料"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                金額
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                発行日
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                支払期限
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                メモ（任意）
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="備考など"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
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
