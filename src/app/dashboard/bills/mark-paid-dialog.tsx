"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markBillAsPaid } from "@/app/actions/bill";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";

const categories = [
  "通信費",
  "外注費",
  "消耗品",
  "旅費交通費",
  "地代家賃",
  "広告宣伝費",
  "その他",
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billId: string;
  vendorName: string;
  title: string;
  amount: number;
};

const fmt = (n: number) => "¥" + new Intl.NumberFormat("ja-JP").format(n);

export default function MarkPaidDialog({
  open,
  onOpenChange,
  billId,
  vendorName,
  title,
  amount,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().split("T")[0];
  const [paidDate, setPaidDate] = useState(today);
  const [category, setCategory] = useState("その他");

  useEffect(() => {
    if (open) {
      setPaidDate(today);
      setCategory("その他");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await markBillAsPaid(billId, paidDate, category);
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
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            支払済にする
          </DialogTitle>
          <DialogDescription>
            支払いを記録し、経費に自動登録します。
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <p className="text-billia-text-muted text-xs mb-1">{vendorName}</p>
          <p className="font-medium text-billia-text">{title}</p>
          <p className="text-lg font-semibold text-billia-text mt-1">
            {fmt(amount)}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                支払日
              </label>
              <input
                type="date"
                required
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                経費カテゴリ
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-billia-text-muted">
            ※ 経費ページにも自動で登録されます。
          </p>
          <DialogFooter>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isPending ? "処理中..." : "支払済にする"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
