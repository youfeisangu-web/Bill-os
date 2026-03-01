"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteExpense } from "@/app/actions/expense";
import NewExpenseDialog from "./new-expense-dialog";
import type { ExpenseInitialValues } from "./new-expense-dialog";
import { Pencil, Trash2 } from "lucide-react";

type Expense = {
  id: string;
  title: string;
  amount: number;
  date: Date;
  category: string;
};

const fmt = (n: number) => "¥" + new Intl.NumberFormat("ja-JP").format(n);

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(
    typeof d === "string" ? new Date(d) : d,
  );

const toDateStr = (d: Date): string => {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().split("T")[0];
};

const categoryColor: Record<string, string> = {
  通信費: "bg-blue-50 text-blue-700",
  外注費: "bg-purple-50 text-purple-700",
  消耗品: "bg-orange-50 text-orange-700",
  旅費交通費: "bg-green-50 text-green-700",
  地代家賃: "bg-yellow-50 text-yellow-700",
  広告宣伝費: "bg-pink-50 text-pink-700",
  その他: "bg-gray-100 text-gray-600",
};

function getMonthKey(d: Date): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${y}年${Number(m)}月`;
}

export default function ExpensesList({
  initialExpenses,
}: {
  initialExpenses: Expense[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [editValues, setEditValues] = useState<ExpenseInitialValues | null>(
    null,
  );
  const [editId, setEditId] = useState<string | undefined>(undefined);

  // Group by month
  const months = Array.from(
    new Set(initialExpenses.map((e) => getMonthKey(e.date))),
  ).sort((a, b) => b.localeCompare(a));

  const handleEdit = (expense: Expense) => {
    setEditId(expense.id);
    setEditValues({
      title: expense.title,
      amount: expense.amount,
      date: toDateStr(expense.date),
      category: expense.category,
    });
    setEditOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    if (!confirm(`「${expense.title}」を削除しますか？`)) return;
    startTransition(async () => {
      const result = await deleteExpense(expense.id);
      if (!result.success) {
        alert(result.message);
        return;
      }
      router.refresh();
    });
  };

  if (initialExpenses.length === 0) {
    return (
      <div className="billia-card p-6 text-center text-sm text-billia-text-muted">
        まだ経費が登録されていません。
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {months.map((monthKey) => {
          const items = initialExpenses.filter(
            (e) => getMonthKey(e.date) === monthKey,
          );
          const monthTotal = items.reduce((s, e) => s + e.amount, 0);

          return (
            <div key={monthKey} className="billia-card overflow-hidden">
              {/* Month header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] bg-billia-bg">
                <p className="text-sm font-semibold text-billia-text">
                  {getMonthLabel(monthKey)}
                </p>
                <p className="text-sm font-semibold text-billia-text">
                  {fmt(monthTotal)}
                </p>
              </div>

              {/* Mobile: cards */}
              <div className="divide-y divide-black/[0.06] md:hidden">
                {items.map((expense) => (
                  <div key={expense.id} className="p-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-billia-text truncate">
                        {expense.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${categoryColor[expense.category] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {expense.category}
                        </span>
                        <span className="text-[11px] text-billia-text-muted">
                          {fmtDate(expense.date)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-sm font-semibold text-billia-text">
                        {fmt(expense.amount)}
                      </p>
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-1.5 rounded-lg text-billia-text-muted hover:bg-billia-bg hover:text-billia-blue transition-colors"
                        aria-label="編集"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-billia-text-muted hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                        aria-label="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-billia-text-muted text-xs border-b border-black/[0.06]">
                      <th className="px-4 py-2.5">件名</th>
                      <th className="px-4 py-2.5">カテゴリ</th>
                      <th className="px-4 py-2.5">日付</th>
                      <th className="px-4 py-2.5 text-right">金額</th>
                      <th className="px-4 py-2.5 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {items.map((expense) => (
                      <tr
                        key={expense.id}
                        className="hover:bg-billia-bg/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-billia-text">
                          {expense.title}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-medium ${categoryColor[expense.category] ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-billia-text-muted">
                          {fmtDate(expense.date)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-billia-text">
                          {fmt(expense.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="p-1.5 rounded-lg text-billia-text-muted hover:bg-billia-bg hover:text-billia-blue transition-colors"
                              aria-label="編集"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(expense)}
                              disabled={isPending}
                              className="p-1.5 rounded-lg text-billia-text-muted hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                              aria-label="削除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <NewExpenseDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialValues={editValues}
        expenseId={editId}
      />
    </>
  );
}
