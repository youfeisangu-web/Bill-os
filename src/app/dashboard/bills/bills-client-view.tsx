"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBill } from "@/app/actions/bill";
import NewBillDialog from "./new-bill-dialog";
import MarkPaidDialog from "./mark-paid-dialog";
import ImportBillButton from "./import-bill-button";
import type { BillFormValues } from "./new-bill-dialog";
import { Plus, Pencil, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

type Bill = {
  id: string;
  vendorName: string;
  title: string;
  amount: number;
  issueDate: Date;
  dueDate: Date;
  status: string;
  paidDate: Date | null;
  category: string | null;
  memo: string | null;
};

const fmt = (n: number) => "¥" + new Intl.NumberFormat("ja-JP").format(n);

const fmtDate = (d: Date | null) => {
  if (!d) return "-";
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(
    typeof d === "string" ? new Date(d) : d,
  );
};

const toDateStr = (d: Date): string => {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().split("T")[0];
};

type FilterType = "all" | "UNPAID" | "PAID";

function getDaysUntilDue(dueDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = typeof dueDate === "string" ? new Date(dueDate) : new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function BillsClientView({
  initialBills,
}: {
  initialBills: Bill[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterType>("UNPAID");

  const [newOpen, setNewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editValues, setEditValues] = useState<BillFormValues | null>(null);
  const [editId, setEditId] = useState<string | undefined>(undefined);

  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markPaidBill, setMarkPaidBill] = useState<Bill | null>(null);

  const unpaid = initialBills.filter((b) => b.status === "UNPAID");
  const overdue = unpaid.filter((b) => getDaysUntilDue(b.dueDate) < 0);
  const unpaidTotal = unpaid.reduce((s, b) => s + b.amount, 0);

  const filtered =
    filter === "all" ? initialBills : initialBills.filter((b) => b.status === filter);

  const handleEdit = (bill: Bill) => {
    setEditId(bill.id);
    setEditValues({
      vendorName: bill.vendorName,
      title: bill.title,
      amount: bill.amount,
      issueDate: toDateStr(bill.issueDate),
      dueDate: toDateStr(bill.dueDate),
      memo: bill.memo ?? "",
    });
    setEditOpen(true);
  };

  const handleDelete = (bill: Bill) => {
    if (!confirm(`「${bill.title}」を削除しますか？`)) return;
    startTransition(async () => {
      const result = await deleteBill(bill.id);
      if (!result.success) {
        alert(result.message);
        return;
      }
      router.refresh();
    });
  };

  const handleMarkPaid = (bill: Bill) => {
    setMarkPaidBill(bill);
    setMarkPaidOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-5 py-5 md:gap-8 md:py-8 pb-12">
        {/* ヘッダー */}
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="billia-label">支払管理</p>
            <h1 className="text-xl font-semibold tracking-tight text-billia-text md:text-2xl">
              受領請求書
            </h1>
            <p className="text-xs text-billia-text-muted hidden md:block">
              他社から届いた請求書を管理し、支払い漏れを防ぎます。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ImportBillButton />
            <button
              onClick={() => setNewOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-billia-sidebar px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-95 md:px-4 md:py-2.5 md:text-sm"
            >
              <Plus className="w-4 h-4" />
              手動で追加
            </button>
          </div>
        </header>

        {/* KPIカード */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          <div className="billia-card p-4">
            <p className="text-[11px] text-billia-text-muted mb-1 md:text-xs">
              未払い合計
            </p>
            <p className="text-base font-semibold text-billia-text md:text-xl">
              {fmt(unpaidTotal)}
            </p>
          </div>
          <div className="billia-card p-4">
            <p className="text-[11px] text-billia-text-muted mb-1 md:text-xs">
              未払い件数
            </p>
            <p className="text-base font-semibold text-billia-text md:text-xl">
              {unpaid.length}件
            </p>
          </div>
          <div className="billia-card p-4 col-span-2 md:col-span-1">
            <p className="text-[11px] text-billia-text-muted mb-1 md:text-xs">
              期限超過
            </p>
            <p
              className={`text-base font-semibold md:text-xl ${overdue.length > 0 ? "text-red-500" : "text-billia-text"}`}
            >
              {overdue.length}件
            </p>
          </div>
        </div>

        {/* フィルタータブ + リスト */}
        <div className="billia-card overflow-hidden">
          <div className="flex items-center gap-1 border-b border-black/[0.06] px-4 pt-3 pb-0">
            {(
              [
                { key: "UNPAID", label: "未払い" },
                { key: "PAID", label: "支払済" },
                { key: "all", label: "すべて" },
              ] as { key: FilterType; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  filter === key
                    ? "border-billia-blue text-billia-blue"
                    : "border-transparent text-billia-text-muted hover:text-billia-text"
                }`}
              >
                {label}
                {key === "UNPAID" && unpaid.length > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-semibold text-amber-700">
                    {unpaid.length}
                  </span>
                )}
                {key === "UNPAID" && overdue.length > 0 && (
                  <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-100 px-1 text-[10px] font-semibold text-red-600">
                    {overdue.length}超過
                  </span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-billia-text-muted">
              {filter === "UNPAID"
                ? "未払いの請求書はありません。"
                : filter === "PAID"
                  ? "支払済の請求書はありません。"
                  : "請求書が登録されていません。"}
            </p>
          ) : (
            <>
              {/* モバイル: カード表示 */}
              <div className="divide-y divide-black/[0.06] md:hidden">
                {filtered.map((bill) => {
                  const daysLeft = getDaysUntilDue(bill.dueDate);
                  const isOverdue = bill.status === "UNPAID" && daysLeft < 0;
                  const isDueSoon =
                    bill.status === "UNPAID" && daysLeft >= 0 && daysLeft <= 7;

                  return (
                    <div key={bill.id} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="text-xs text-billia-text-muted truncate">
                            {bill.vendorName}
                          </p>
                          <p className="text-sm font-medium text-billia-text truncate">
                            {bill.title}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-billia-text">
                            {fmt(bill.amount)}
                          </p>
                          {bill.status === "PAID" ? (
                            <span className="text-[11px] text-emerald-600 font-medium">
                              支払済
                            </span>
                          ) : isOverdue ? (
                            <span className="text-[11px] text-red-500 font-medium flex items-center gap-0.5 justify-end">
                              <AlertCircle className="w-3 h-3" />
                              {Math.abs(daysLeft)}日超過
                            </span>
                          ) : isDueSoon ? (
                            <span className="text-[11px] text-amber-600 font-medium">
                              あと{daysLeft}日
                            </span>
                          ) : (
                            <span className="text-[11px] text-billia-text-muted">
                              あと{daysLeft}日
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-billia-text-muted">
                          期限: {fmtDate(bill.dueDate)}
                          {bill.status === "PAID" &&
                            bill.paidDate &&
                            ` / 支払: ${fmtDate(bill.paidDate)}`}
                        </p>
                        <div className="flex items-center gap-1">
                          {bill.status === "UNPAID" && (
                            <button
                              onClick={() => handleMarkPaid(bill)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              支払済
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(bill)}
                            className="p-1.5 rounded-lg text-billia-text-muted hover:bg-billia-bg hover:text-billia-blue transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(bill)}
                            disabled={isPending}
                            className="p-1.5 rounded-lg text-billia-text-muted hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* デスクトップ: テーブル表示 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-billia-text-muted text-xs border-b border-black/[0.06] bg-billia-bg">
                      <th className="px-4 py-3">請求元</th>
                      <th className="px-4 py-3">件名</th>
                      <th className="px-4 py-3">発行日</th>
                      <th className="px-4 py-3">支払期限</th>
                      <th className="px-4 py-3">残日数</th>
                      <th className="px-4 py-3 text-right">金額</th>
                      <th className="px-4 py-3">状態</th>
                      <th className="px-4 py-3 w-40"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {filtered.map((bill) => {
                      const daysLeft = getDaysUntilDue(bill.dueDate);
                      const isOverdue = bill.status === "UNPAID" && daysLeft < 0;
                      const isDueSoon =
                        bill.status === "UNPAID" &&
                        daysLeft >= 0 &&
                        daysLeft <= 7;

                      return (
                        <tr
                          key={bill.id}
                          className={`hover:bg-billia-bg/50 transition-colors ${isOverdue ? "bg-red-50/30" : ""}`}
                        >
                          <td className="px-4 py-3 text-billia-text-muted">
                            {bill.vendorName}
                          </td>
                          <td className="px-4 py-3 font-medium text-billia-text">
                            {bill.title}
                            {bill.memo && (
                              <p className="text-xs text-billia-text-muted font-normal">
                                {bill.memo}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-billia-text-muted">
                            {fmtDate(bill.issueDate)}
                          </td>
                          <td className="px-4 py-3 text-billia-text-muted">
                            {fmtDate(bill.dueDate)}
                          </td>
                          <td className="px-4 py-3">
                            {bill.status === "PAID" ? (
                              <span className="text-billia-text-muted">
                                支払: {fmtDate(bill.paidDate)}
                              </span>
                            ) : isOverdue ? (
                              <span className="flex items-center gap-1 text-red-500 font-medium">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {Math.abs(daysLeft)}日超過
                              </span>
                            ) : (
                              <span
                                className={
                                  isDueSoon
                                    ? "text-amber-600 font-medium"
                                    : "text-billia-text-muted"
                                }
                              >
                                あと{daysLeft}日
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-billia-text">
                            {fmt(bill.amount)}
                          </td>
                          <td className="px-4 py-3">
                            {bill.status === "PAID" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                支払済
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-amber-600">
                                未払い
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {bill.status === "UNPAID" && (
                                <button
                                  onClick={() => handleMarkPaid(bill)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  支払済
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(bill)}
                                className="p-1.5 rounded-lg text-billia-text-muted hover:bg-billia-bg hover:text-billia-blue transition-colors"
                                aria-label="編集"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(bill)}
                                disabled={isPending}
                                className="p-1.5 rounded-lg text-billia-text-muted hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                                aria-label="削除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <NewBillDialog
        open={newOpen}
        onOpenChange={setNewOpen}
      />
      <NewBillDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialValues={editValues}
        billId={editId}
      />
      {markPaidBill && (
        <MarkPaidDialog
          open={markPaidOpen}
          onOpenChange={setMarkPaidOpen}
          billId={markPaidBill.id}
          vendorName={markPaidBill.vendorName}
          title={markPaidBill.title}
          amount={markPaidBill.amount}
        />
      )}
    </>
  );
}
