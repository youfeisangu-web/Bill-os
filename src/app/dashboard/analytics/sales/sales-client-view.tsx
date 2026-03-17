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
  BarChart3,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
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
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* ── Header & Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">売上分析</h1>
          <p className="text-sm text-slate-500 mt-1">リアルタイムのパフォーマンスとAIによるインサイト</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400 ml-2" />
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
            className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer pr-4"
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
        </div>
      </div>

      {!bannerDismissed && (
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-4 md:p-5 shadow-sm text-slate-900 group flex items-start justify-between gap-4 group">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
             <BarChart3 className="w-32 h-32 transform rotate-12" />
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              {monthLabel} のデータ入力
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-2xl mt-1">
              各カテゴリの売上金額を入力して保存することで、リアルタイムでの成長率やレポートが自動生成されます。AI振り分け機能を使えば、請求書データから自動的に実績を反映させることも可能です。
            </p>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="relative z-10 shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* KPI 1 */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm font-semibold text-slate-500 mb-1">当月売上</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            ¥{kpi.sales.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${kpi.growthRate >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
              {kpi.growthRate >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {formatPercent(kpi.growthRate)}
            </span>
            <span className="text-xs text-slate-400">前月比</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-sm font-semibold text-slate-500 mb-1">登録済 請求書</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            {kpi.customers} <span className="text-lg text-slate-400 font-medium">件</span>
          </p>
          <p className="text-xs text-slate-400">現在記録されている当月の請求書</p>
        </div>

        {/* KPI 3 */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm text-slate-900">
          <div className="absolute -right-4 -bottom-4 opacity-20">
            <TrendingUp className="w-24 h-24" />
          </div>
          <p className="text-sm font-semibold text-slate-500 mb-1">売上成長率</p>
          <p className={`text-3xl font-black tracking-tight mb-1 ${kpi.growthRate >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatPercent(kpi.growthRate)}
          </p>
          <p className="text-xs text-slate-500 relative z-10">全体の月次トレンドに基づく</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Main Chart ── */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">月次売上推移</h2>
              <p className="text-xs text-slate-500 mt-1">過去12ヶ月間の売上総額の推移</p>
            </div>
            <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-xs font-semibold text-slate-600">
              {monthLabel}
            </div>
          </div>
          <div className="flex-1 min-h-[220px] flex items-end gap-1 sm:gap-2">
            {monthlySummary.map((row, i) => {
              const heightPct = Math.max(2, (row.total / maxMonthly) * 100);
              const isCurrent = row.month === selectedMonth;
              return (
                <div
                  key={row.month}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-white text-slate-900 border border-slate-200 text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 transition-opacity pointer-events-none shadow-lg">
                    {row.month} <br/> <span className="font-bold">{formatYen(row.total)}</span>
                  </div>
                  <div
                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ease-out ${isCurrent ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.3)]' : 'bg-slate-200 group-hover:bg-slate-300'}`}
                    style={{ height: `${heightPct}%` }}
                  />
                  {i % 2 === 0 && (
                    <span className="text-[9px] text-slate-400 mt-2 truncate max-w-full block">
                      {row.month.split("-")[1]}月
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── AI Assistant & Trends ── */}
        <div className="flex flex-col gap-6">
          {/* AI */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-50 via-white to-purple-50/50 border border-purple-100 shadow-sm p-5 md:p-6 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-400/20 blur-3xl rounded-full pointer-events-none group-hover:bg-purple-400/30 transition-colors" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl shadow-inner">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">AI自動振り分け</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              未分類の請求書を選択すると、AIが内容を解析して最適な売上カテゴリへ自動的に振り分けます。
            </p>
            
            {categories.length > 0 && recentInvoices.length > 0 ? (
              <div className="space-y-3 relative z-10">
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="w-full rounded-xl border border-purple-200/60 bg-white/80 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-sm"
                >
                  <option value="">請求書を選択してください...</option>
                  {recentInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {new Date(inv.issueDate).toLocaleDateString("ja-JP")} {inv.clientName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleCategorizeInvoice}
                  disabled={pending || !selectedInvoiceId}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 disabled:opacity-60 transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  AIで解析して反映
                </button>
              </div>
            ) : (
              <div className="text-xs text-purple-500/80 bg-purple-100/50 rounded-lg p-3 text-center border border-purple-100">
                カテゴリまたは最近の請求書がありません。
              </div>
            )}
            
            {aiMessage && (
              <div className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${aiMessage.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${aiMessage.type === 'ok' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}/>
                {aiMessage.text}
              </div>
            )}
          </div>
          
          {/* Trend Card */}
          <div className="bg-white rounded-2xl p-5 md:p-6 text-slate-900 border border-slate-200 shadow-sm relative overflow-hidden flex-1">
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 to-transparent pointer-events-none" />
             <div className="flex justify-between items-center mb-4 relative z-10">
               <h3 className="font-bold text-sm text-slate-900">カテゴリ別成長率</h3>
               <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">前月比</span>
             </div>
             <div className="space-y-4 relative z-10">
                {categories.map((c) => {
                  const current = amounts[c.id] ?? 0;
                  const lastMonthAmount = initialLastMonthEntries.find((e) => e.categoryId === c.id)?.amount ?? 0;
                  const growth = lastMonthAmount > 0 ? ((current - lastMonthAmount) / lastMonthAmount) * 100 : current > 0 ? 100 : 0;
                  return (
                    <div key={c.id} className="flex justify-between items-center">
                      <span className="text-xs text-slate-700 truncate pr-4 font-medium">{c.name}</span>
                      <div className="flex items-center gap-2">
                         <span className={`text-xs font-bold ${growth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                           {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                         </span>
                      </div>
                    </div>
                  );
                })}
                {categories.length === 0 && <p className="text-xs text-slate-500">データなし</p>}
             </div>
          </div>
        </div>
      </div>

      {/* ── Category Breakdown ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              カテゴリ別売上内訳
            </h2>
            <p className="text-xs text-slate-500 mt-1">ダッシュボードに反映されるカテゴリデータの手動調整・追加</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={pending}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-sm disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${pending ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">最新の情報に更新</span>
          </button>
        </div>

        <div className="p-5 md:p-6 bg-slate-50/50">
          {categories.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
               <span className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                 <BarChart3 className="w-6 h-6 text-slate-400" />
               </span>
               <p className="text-sm font-medium text-slate-700">カテゴリがありません</p>
               <p className="text-xs text-slate-500 mt-1 mb-4">右側のフォームから新しく追加してください。</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              
              {/* Horizontal Bar Chart representation */}
              <div className="flex-1 space-y-5 py-2">
                {categories.map((c, i) => {
                  const val = amounts[c.id] ?? 0;
                  const pct = Math.max(1, (val / maxCategory) * 100);
                  const colors = [
                    "from-blue-500 to-cyan-400",
                    "from-indigo-500 to-purple-400",
                    "from-emerald-500 to-teal-400",
                    "from-amber-500 to-orange-400",
                    "from-pink-500 to-rose-400"
                  ];
                  const color = colors[i % colors.length];
                  return (
                    <div key={c.id} className="relative group">
                       <div className="flex justify-between items-end mb-1.5">
                         <span className="text-xs font-semibold text-slate-700">{c.name}</span>
                         <span className="text-sm font-bold text-slate-900 tracking-tight">{formatYen(val)}</span>
                       </div>
                       <div className="h-3 w-full bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
                            style={{ width: `${pct}%` }}
                          />
                       </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Inputs Form */}
              <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm self-start w-full">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"/>データ編集
                </h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {categories.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <label className="text-xs font-medium text-slate-700 w-24 truncate" title={c.name}>
                        {c.name}
                      </label>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">¥</span>
                        <input
                          type="number"
                          min={0}
                          value={amounts[c.id] ?? 0}
                          onChange={(e) =>
                            setAmounts((a) => ({ ...a, [c.id]: Number(e.target.value) || 0 }))
                          }
                          className="w-full rounded-lg border-slate-200 pl-8 pr-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-slate-100 space-y-4">
                  <button
                    type="button"
                    onClick={handleSaveAmounts}
                    disabled={pending}
                    className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-xs font-bold shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98] hover:shadow-lg"
                  >
                    入力内容を保存する
                  </button>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="新規カテゴリ名..."
                      className="flex-1 rounded-xl border-slate-200 px-3 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={pending || !newCategoryName.trim()}
                      className="px-4 py-2.5 shrink-0 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs hover:bg-blue-100 disabled:opacity-50 transition-colors"
                    >
                      追加
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
