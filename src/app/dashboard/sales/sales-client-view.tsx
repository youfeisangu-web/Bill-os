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
  X,
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  Sparkles,
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
  return s + "%";
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
      setAiMessage(
        res.success
          ? { type: "ok", text: res.message ?? "反映しました" }
          : { type: "error", text: res.message ?? "失敗しました" }
      );
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
    <div className="space-y-4 md:space-y-6">
      {/* 情報バナー */}
      {!bannerDismissed && (
        <div className="flex items-start justify-between gap-3 rounded-xl bg-blue-50 px-4 py-3 border border-blue-100">
          <p className="text-xs text-blue-700 leading-relaxed md:text-sm">
            <span className="font-semibold">{monthLabel}</span>の売上データを入力・更新できます。
            カテゴリ別の金額を入力し「保存」してください。
          </p>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className="shrink-0 p-1 rounded text-blue-400 hover:bg-blue-100"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI カード */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="billia-card p-3 md:p-5">
          <p className="text-[10px] text-billia-text-muted mb-1 truncate md:text-sm">売上</p>
          <p className="text-xs font-bold text-billia-text leading-snug md:text-2xl md:font-semibold">
            ¥{kpi.sales.toLocaleString()}
          </p>
          <p className="text-[10px] text-billia-text-muted mt-0.5 hidden md:block md:mt-1">
            当月（カテゴリ合計）
          </p>
        </div>
        <div className="billia-card p-3 md:p-5">
          <p className="text-[10px] text-billia-text-muted mb-1 md:text-sm">請求書</p>
          <p className="text-xs font-bold text-billia-text leading-snug md:text-2xl md:font-semibold">
            {kpi.customers}
            <span className="text-[10px] font-normal md:text-sm ml-0.5">件</span>
          </p>
          <p className="text-[10px] text-billia-text-muted mt-0.5 hidden md:block md:mt-1">
            登録済み
          </p>
        </div>
        <div className="billia-card p-3 md:p-5">
          <p className="text-[10px] text-billia-text-muted mb-1 md:text-sm">成長率</p>
          <p
            className={`text-xs font-bold leading-snug md:text-2xl md:font-semibold ${
              kpi.growthRate >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {formatPercent(kpi.growthRate)}
          </p>
          <p className="text-[10px] text-billia-text-muted mt-0.5 flex items-center gap-0.5 md:mt-1">
            {kpi.growthRate >= 0 ? (
              <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5 md:h-3 md:w-3" />
            )}
            <span className="hidden md:inline">前月比</span>
          </p>
        </div>
      </div>

      {/* 月次売上チャート */}
      <div className="billia-card p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-billia-text md:text-lg">月次売上</h2>
          <span className="text-xs text-billia-text-muted">{monthLabel}</span>
        </div>
        <div className="h-28 flex items-end gap-0.5 md:h-40">
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
      <div className="billia-card p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-sm font-semibold text-billia-text md:text-lg">カテゴリ別売上</h2>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => {
                const nextMonth = e.target.value;
                setSelectedMonth(nextMonth);
                startTransition(async () => {
                  const { entries: nextEntries } = await getCategorySalesByMonth(nextMonth);
                  const next: Record<string, number> = {};
                  categories.forEach((c) => {
                    const ent = nextEntries.find((x) => x.categoryId === c.id);
                    next[c.id] = ent?.amount ?? 0;
                  });
                  setAmounts(next);
                });
              }}
              className="rounded-lg border border-billia-border px-2 py-1.5 text-xs bg-white md:px-3 md:text-sm"
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
              className="p-1.5 rounded-lg border border-billia-border hover:bg-black/[0.04]"
              aria-label="更新"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {categories.length === 0 ? (
          <p className="text-billia-text-muted text-sm py-4">
            カテゴリがありません。下のフォームで追加してください。
          </p>
        ) : (
          <div className="space-y-4">
            {/* バーチャート */}
            <div className="h-32 flex items-end gap-1.5 md:h-48 md:gap-2">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex-1 min-w-[28px] flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full max-w-[44px] bg-billia-blue/75 rounded-t transition-all"
                    style={{
                      height: `${Math.max(4, ((amounts[c.id] ?? 0) / maxCategory) * 100)}%`,
                    }}
                  />
                  <span className="text-[9px] text-billia-text-muted truncate max-w-full text-center leading-tight md:text-[10px]">
                    {c.name}
                  </span>
                </div>
              ))}
            </div>

            {/* カテゴリ入力 */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <label className="text-xs text-billia-text w-20 shrink-0 truncate md:w-24 md:text-sm">
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
                    className="flex-1 rounded-lg border border-billia-border px-2 py-1.5 text-xs md:px-3 md:py-2 md:text-sm"
                  />
                  <span className="text-billia-text-muted text-xs shrink-0 md:text-sm">円</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveAmounts}
              disabled={pending}
              className="rounded-lg bg-billia-blue text-white px-4 py-2 text-xs font-medium hover:bg-billia-blue-dark disabled:opacity-60 md:text-sm"
            >
              保存
            </button>
          </div>
        )}

        {/* カテゴリ追加 */}
        <div className="mt-5 pt-4 border-t border-billia-border">
          <p className="text-xs font-medium text-billia-text mb-2 md:text-sm">カテゴリを追加</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="例: 食品、日用品"
              className="rounded-lg border border-billia-border px-3 py-1.5 text-xs flex-1 max-w-xs md:py-2 md:text-sm"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={pending || !newCategoryName.trim()}
              className="flex items-center gap-1 rounded-lg border border-billia-border px-2.5 py-1.5 text-xs hover:bg-black/[0.04] disabled:opacity-50 md:px-3 md:py-2 md:text-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              追加
            </button>
          </div>
        </div>
      </div>

      {/* 請求書をAIで振り分け */}
      {categories.length > 0 && recentInvoices.length > 0 && (
        <div className="billia-card p-4 md:p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="h-4 w-4 text-billia-blue shrink-0" />
            <h2 className="text-sm font-semibold text-billia-text md:text-base">
              AIで請求書を振り分け
            </h2>
          </div>
          <p className="text-xs text-billia-text-muted mb-3 md:text-sm">
            請求書を選ぶと、AIがカテゴリに振り分けます。
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="rounded-lg border border-billia-border px-3 py-2 text-xs bg-white w-full sm:w-auto sm:min-w-[200px] md:text-sm"
            >
              <option value="">請求書を選択</option>
              {recentInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {new Date(inv.issueDate).toLocaleDateString("ja-JP")} {inv.clientName}（
                  {formatYen(inv.totalAmount)}）
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCategorizeInvoice}
              disabled={pending || !selectedInvoiceId}
              className="rounded-lg bg-billia-blue text-white px-4 py-2 text-xs font-medium hover:bg-billia-blue-dark disabled:opacity-60 md:text-sm"
            >
              振り分けて反映
            </button>
          </div>
          {aiMessage && (
            <p
              className={`mt-2 text-xs md:text-sm ${
                aiMessage.type === "ok" ? "text-billia-green" : "text-red-600"
              }`}
            >
              {aiMessage.text}
            </p>
          )}
        </div>
      )}

      {/* カテゴリ別伸び率（前月比） */}
      {categories.length > 0 && selectedMonth === currentMonth && (
        <div className="billia-card p-4 md:p-5">
          <h2 className="text-sm font-semibold text-billia-text mb-3 md:text-lg md:mb-4">
            カテゴリ別伸び率（前月比）
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
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
                    initialLastMonthEntries.find((e) => e.categoryId === c.id)?.amount ?? 0;
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
                            growth >= 0 ? "text-emerald-600 font-medium" : "text-red-500 font-medium"
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
