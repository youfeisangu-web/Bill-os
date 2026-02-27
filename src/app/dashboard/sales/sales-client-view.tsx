"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getSalesCategories,
  createSalesCategory,
  upsertCategorySales,
  getCategorySalesByMonth,
  getMonthlySalesSummary,
  categorizeInvoiceWithAI,
} from "@/app/actions/sales-category";
import {
  Info,
  X,
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
} from "lucide-react";

type Category = Awaited<ReturnType<typeof getSalesCategories>>[number];
type Entry = Awaited<ReturnType<typeof getCategorySalesByMonth>>["entries"][number];
type MonthlyRow = Awaited<ReturnType<typeof getMonthlySalesSummary>>[number];

type LastMonthEntry = Entry & { category: { id: string; name: string } };

type InvoiceOption = {
  id: string;
  issueDate: string;
  totalAmount: number;
  clientName: string;
};

type Props = {
  initialCategories: Category[];
  initialEntries: Entry[];
  initialMonthlySummary: MonthlyRow[];
  initialLastMonthEntries: LastMonthEntry[];
  recentInvoices: InvoiceOption[];
  currentMonth: string;
  kpi: { sales: number; customers: number; growthRate: number };
};

function formatYen(n: number) {
  return new Intl.NumberFormat("ja-JP", { style: "decimal" }).format(n) + " 円";
}

function formatPercent(n: number) {
  const s = n >= 0 ? `+${n.toFixed(1)}` : n.toFixed(1);
  return s + " %";
}

export default function SalesClientView({
  initialCategories,
  initialEntries,
  initialMonthlySummary,
  initialLastMonthEntries,
  recentInvoices,
  currentMonth,
  kpi,
}: Props) {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [categories, setCategories] = useState(initialCategories);
  const [entries, setEntries] = useState(initialEntries);
  const [monthlySummary, setMonthlySummary] = useState(initialMonthlySummary);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [amounts, setAmounts] = useState<Record<string, number>>(() => {
    const o: Record<string, number> = {};
    initialEntries.forEach((e) => {
      o[e.categoryId] = e.amount;
    });
    initialCategories.forEach((c) => {
      if (o[c.id] === undefined) o[c.id] = 0;
    });
    return o;
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [aiMessage, setAiMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const refresh = () => {
    startTransition(async () => {
      const [cats, { entries: e }, summary] = await Promise.all([
        getSalesCategories(),
        getCategorySalesByMonth(selectedMonth),
        getMonthlySalesSummary(12),
      ]);
      setCategories(cats);
      setEntries(e);
      setMonthlySummary(summary);
      const nextAmounts: Record<string, number> = {};
      cats.forEach((c) => {
        const ent = e.find((x) => x.categoryId === c.id);
        nextAmounts[c.id] = ent?.amount ?? 0;
      });
      setAmounts(nextAmounts);
    });
  };

  const handleSaveAmounts = () => {
    startTransition(async () => {
      const updates = Object.entries(amounts).map(([categoryId, amount]) => ({
        categoryId,
        amount: Number(amount) || 0,
      }));
      await upsertCategorySales(selectedMonth, updates);
      refresh();
    });
  };

  const handleCategorizeInvoice = () => {
    if (!selectedInvoiceId) return;
    setAiMessage(null);
    startTransition(async () => {
      const res = await categorizeInvoiceWithAI(selectedInvoiceId);
      setAiMessage(res.success ? { type: "ok", text: res.message ?? "反映しました" } : { type: "error", text: res.message ?? "失敗しました" });
      if (res.success) {
        refresh();
        router.refresh();
      }
    });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", newCategoryName.trim());
      await createSalesCategory(fd);
      setNewCategoryName("");
      const cats = await getSalesCategories();
      setCategories(cats);
      cats.forEach((c) => {
        if (amounts[c.id] === undefined) setAmounts((a) => ({ ...a, [c.id]: 0 }));
      });
    });
  };

  const maxMonthly = Math.max(1, ...monthlySummary.map((m) => m.total));
  const maxCategory = Math.max(1, ...Object.values(amounts));

  const [year, month] = selectedMonth.split("-").map(Number);
  const monthLabel = `${year}年${month}月`;

  return (
    <div className="space-y-6 pb-12">
      {/* 情報バナー */}
      {!bannerDismissed && (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-billia-blue/10 px-4 py-3 text-billia-blue border border-billia-blue/20">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 shrink-0" />
            <span className="text-sm">
              {monthLabel}の売上データを入力・更新できます。カテゴリ別の金額を入力し「保存」してください。
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className="p-1 rounded hover:bg-billia-blue/20"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="billia-card p-5">
          <p className="text-sm text-billia-text-muted mb-1">売上</p>
          <p className="text-2xl font-semibold text-billia-text">
            {formatYen(kpi.sales)}
          </p>
          <p className="text-xs text-billia-text-muted mt-1">当月（カテゴリ合計）</p>
        </div>
        <div className="billia-card p-5">
          <p className="text-sm text-billia-text-muted mb-1">請求書</p>
          <p className="text-2xl font-semibold text-billia-text">
            {kpi.customers} 件
          </p>
          <p className="text-xs text-billia-text-muted mt-1">登録済み</p>
        </div>
        <div className="billia-card p-5">
          <p className="text-sm text-billia-text-muted mb-1">成長率</p>
          <p className="text-2xl font-semibold text-billia-text">
            {formatPercent(kpi.growthRate)}
          </p>
          <p className="text-xs text-billia-text-muted mt-1 flex items-center gap-1">
            {kpi.growthRate >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            前月比
          </p>
        </div>
      </div>

      {/* 月次売上 */}
      <div className="billia-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-billia-text">月次売上</h2>
          <span className="text-sm text-billia-text-muted">{monthLabel}</span>
        </div>
        <div className="h-40 flex items-end gap-0.5">
          {monthlySummary.map((row) => (
            <div
              key={row.month}
              className="flex-1 min-w-0 flex flex-col items-center"
              title={`${row.month}: ${formatYen(row.total)}`}
            >
              <div
                className="w-full bg-billia-blue/70 rounded-t min-h-[2px] transition-all"
                style={{
                  height: `${Math.max(2, (row.total / maxMonthly) * 100)}%`,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-billia-text-muted">
          <span>{monthlySummary[0]?.month ?? ""}</span>
          <span>{monthlySummary[monthlySummary.length - 1]?.month ?? ""}</span>
        </div>
      </div>

      {/* カテゴリ別売上 */}
      <div className="billia-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-billia-text">カテゴリ別売上</h2>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => {
                const nextMonth = e.target.value;
                setSelectedMonth(nextMonth);
                startTransition(async () => {
                  const { entries: nextEntries } = await getCategorySalesByMonth(nextMonth);
                  setEntries(nextEntries);
                  const next: Record<string, number> = {};
                  categories.forEach((c) => {
                    const ent = nextEntries.find((x) => x.categoryId === c.id);
                    next[c.id] = ent?.amount ?? 0;
                  });
                  setAmounts(next);
                });
              }}
              className="rounded-lg border border-billia-border px-3 py-1.5 text-sm bg-white"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const [y, m] = currentMonth.split("-").map(Number);
                const d = new Date(y, m - 1 - i, 1);
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                return (
                  <option key={monthKey} value={monthKey}>
                    {d.getFullYear()}年{d.getMonth() + 1}月
                  </option>
                );
              })}
            </select>
            <button
              type="button"
              onClick={refresh}
              disabled={pending}
              className="p-2 rounded-lg border border-billia-border hover:bg-black/[0.04]"
              aria-label="更新"
            >
              <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {categories.length === 0 ? (
          <p className="text-billia-text-muted text-sm py-4">
            カテゴリがありません。下のフォームで追加してください。
          </p>
        ) : (
          <div className="space-y-4">
            <div className="h-48 flex items-end gap-2">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex-1 min-w-[40px] flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full max-w-[48px] bg-billia-blue/80 rounded-t transition-all"
                    style={{
                      height: `${Math.max(4, (amounts[c.id] ?? 0) / maxCategory) * 100}%`,
                    }}
                  />
                  <span className="text-[10px] text-billia-text-muted truncate max-w-full text-center">
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <label className="text-sm text-billia-text w-24 shrink-0 truncate">
                    {c.name}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={amounts[c.id] ?? 0}
                    onChange={(e) =>
                      setAmounts((a) => ({
                        ...a,
                        [c.id]: Number(e.target.value) || 0,
                      }))
                    }
                    className="flex-1 rounded-lg border border-billia-border px-3 py-2 text-sm"
                  />
                  <span className="text-billia-text-muted text-sm">円</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSaveAmounts}
              disabled={pending}
              className="rounded-lg bg-billia-blue text-white px-4 py-2 text-sm font-medium hover:bg-billia-blue-dark disabled:opacity-60"
            >
              保存
            </button>
          </div>
        )}

        {/* カテゴリ追加 */}
        <div className="mt-6 pt-4 border-t border-billia-border">
          <p className="text-sm font-medium text-billia-text mb-2">カテゴリを追加</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="例: 食品、日用品"
              className="rounded-lg border border-billia-border px-3 py-2 text-sm flex-1 max-w-xs"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={pending || !newCategoryName.trim()}
              className="flex items-center gap-1 rounded-lg border border-billia-border px-3 py-2 text-sm hover:bg-black/[0.04] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              追加
            </button>
          </div>
        </div>
      </div>

      {/* 請求書をAIで振り分け */}
      {categories.length > 0 && recentInvoices.length > 0 && (
        <div className="billia-card p-5">
          <h2 className="text-lg font-semibold text-billia-text mb-2">
            請求書を読み込んでAIで振り分け
          </h2>
          <p className="text-sm text-billia-text-muted mb-4">
            請求書を選ぶと、明細をAIがカテゴリに振り分け、発行月のカテゴリ別売上に加算します。
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="rounded-lg border border-billia-border px-3 py-2 text-sm bg-white min-w-[200px]"
            >
              <option value="">請求書を選択</option>
              {recentInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {new Date(inv.issueDate).toLocaleDateString("ja-JP")} {inv.clientName}（{formatYen(inv.totalAmount)}）
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCategorizeInvoice}
              disabled={pending || !selectedInvoiceId}
              className="rounded-lg bg-billia-blue text-white px-4 py-2 text-sm font-medium hover:bg-billia-blue-dark disabled:opacity-60"
            >
              AIで振り分けて反映
            </button>
          </div>
          {aiMessage && (
            <p className={`mt-2 text-sm ${aiMessage.type === "ok" ? "text-billia-green" : "text-red-600"}`}>
              {aiMessage.text}
            </p>
          )}
        </div>
      )}

      {/* カテゴリ別伸び率（前月比） */}
      {categories.length > 0 && selectedMonth === currentMonth && (
        <div className="billia-card p-5">
          <h2 className="text-lg font-semibold text-billia-text mb-4">
            カテゴリ別伸び率（前月比）
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-billia-border">
                  <th className="text-left py-2 font-medium text-billia-text">分類</th>
                  <th className="text-right py-2 font-medium text-billia-text">伸び率</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => {
                  const current = amounts[c.id] ?? 0;
                  const lastMonthAmount =
                    initialLastMonthEntries.find((e) => e.categoryId === c.id)?.amount ??
                    0;
                  const growth =
                    lastMonthAmount > 0
                      ? ((current - lastMonthAmount) / lastMonthAmount) * 100
                      : current > 0
                        ? 100
                        : 0;
                  return (
                    <tr key={c.id} className="border-b border-billia-border-subtle">
                      <td className="py-2 text-billia-text">{c.name}</td>
                      <td className="py-2 text-right">
                        <span
                          className={
                            growth >= 0 ? "text-billia-green" : "text-red-600"
                          }
                        >
                          {growth >= 0 ? "+" : ""}
                          {growth.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
