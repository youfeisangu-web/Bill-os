"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, AlertCircle, ArrowRight, Clock } from "lucide-react";
import type {
  MonthlyFinancial,
  CategoryExpense,
  TopClient,
  UpcomingPayment,
  FinanceKPI,
} from "@/app/actions/finance";

type Period = "1m" | "6m" | "1y" | "5y";

type Props = {
  monthly: MonthlyFinancial[];
  categories: CategoryExpense[];
  topClients: TopClient[];
  upcoming: UpcomingPayment[];
  kpi: FinanceKPI;
};

const fmt = (n: number) => "¥" + new Intl.NumberFormat("ja-JP").format(Math.abs(n));

const PERIODS: { label: string; value: Period; months: number }[] = [
  { label: "1ヶ月", value: "1m", months: 1 },
  { label: "半年", value: "6m", months: 6 },
  { label: "1年", value: "1y", months: 12 },
  { label: "5年", value: "5y", months: 60 },
];

const CATEGORY_COLORS: Record<string, string> = {
  通信費: "#3B82F6",
  外注費: "#8B5CF6",
  消耗品: "#F59E0B",
  旅費交通費: "#F97316",
  地代家賃: "#06B6D4",
  広告宣伝費: "#EC4899",
  その他: "#6B7280",
};

function niceScale(maxVal: number, minVal: number, targetTicks = 5): number[] {
  const range = maxVal - minVal;
  if (range <= 0) return [minVal, minVal + 100000];
  const roughStep = range / (targetTicks - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const n = roughStep / magnitude;
  const niceStep = (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * magnitude;
  const niceMin = Math.floor(minVal / niceStep) * niceStep;
  const niceMax = Math.ceil(maxVal / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + niceStep * 0.01; v += niceStep) {
    ticks.push(Math.round(v));
  }
  return ticks;
}

// ─── SVG 線グラフ ─────────────────────────────────────────────────
function LineChart({ data }: { data: MonthlyFinancial[] }) {
  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-gray-400">
        データがありません
      </div>
    );
  }

  if (data.length === 1) {
    const d = data[0];
    return (
      <div className="h-32 flex items-center justify-center gap-10">
        <div className="text-center">
          <p className="text-[11px] text-gray-400 mb-1">収入</p>
          <p className="text-base font-bold text-blue-600">{fmt(d.income)}</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-gray-400 mb-1">経費</p>
          <p className="text-base font-bold text-red-500">{fmt(d.expense)}</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-gray-400 mb-1">利益</p>
          <p className={`text-base font-bold ${d.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {fmt(d.profit)}
          </p>
        </div>
      </div>
    );
  }

  const W = 560, H = 155;
  const pad = { l: 8, t: 22, r: 8, b: 26 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const allVals = data.flatMap((d) => [d.income, d.expense, d.profit]);
  const minVal = Math.min(0, ...allVals);
  const maxVal = Math.max(1, ...allVals);

  const ticks = niceScale(maxVal, minVal, 4);
  const tickMin = ticks[0];
  const tickMax = ticks[ticks.length - 1];
  const tickRange = tickMax - tickMin || 1;

  const xAt = (i: number) => pad.l + (i / (data.length - 1)) * iw;
  const yAt = (v: number) => pad.t + (1 - (v - tickMin) / tickRange) * ih;
  const zeroY = yAt(0);

  const pts = (key: keyof MonthlyFinancial) =>
    data.map((d, i) => `${xAt(i)},${yAt(d[key] as number)}`).join(" ");

  const incomeArea =
    `${xAt(0)},${zeroY} ` +
    data.map((d, i) => `${xAt(i)},${yAt(d.income)}`).join(" ") +
    ` ${xAt(data.length - 1)},${zeroY}`;

  const isMultiYear = data.length > 24;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="financeIncomeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines + Y-axis labels (inside chart, above each line) */}
      {ticks.map((v, i) => (
        <g key={i}>
          <line
            x1={pad.l} y1={yAt(v)}
            x2={W - pad.r} y2={yAt(v)}
            stroke={v === 0 ? "#e5e7eb" : "#f3f4f6"}
            strokeWidth="1"
          />
          <text
            x={pad.l + 4} y={yAt(v) - 3}
            textAnchor="start" fontSize="9" fill="#c8cdd6"
            fontFamily="system-ui, sans-serif"
          >
            {fmt(v)}
          </text>
        </g>
      ))}

      {/* Income area fill */}
      <polygon points={incomeArea} fill="url(#financeIncomeGrad)" />

      {/* Expense line */}
      <polyline
        points={pts("expense")} fill="none" stroke="#F87171"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="4,3"
      />

      {/* Profit line */}
      <polyline
        points={pts("profit")} fill="none" stroke="#10B981"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />

      {/* Income line */}
      <polyline
        points={pts("income")} fill="none" stroke="#3B82F6"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />

      {/* Income dots (short ranges only) */}
      {data.length <= 12 && data.map((d, i) => (
        <circle
          key={i} cx={xAt(i)} cy={yAt(d.income)} r="2.5"
          fill="white" stroke="#3B82F6" strokeWidth="1.5"
        />
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => {
        const [y, m] = d.month.split("-").map(Number);
        if (isMultiYear) {
          const isFirst = i === 0;
          const isJanuary = m === 1;
          if (!isFirst && !isJanuary) return null;
          return (
            <text key={i} x={xAt(i)} y={H - 4} textAnchor="middle"
              fontSize="9" fill="#c8cdd6" fontFamily="system-ui, sans-serif">
              {isFirst && !isJanuary ? `${m}月` : `${y}年`}
            </text>
          );
        }
        return (
          <text key={i} x={xAt(i)} y={H - 4} textAnchor="middle"
            fontSize="9" fill="#c8cdd6" fontFamily="system-ui, sans-serif">
            {m}月
          </text>
        );
      })}
    </svg>
  );
}

// ─── メインビュー ─────────────────────────────────────────────────
export default function FinanceClientView({ monthly, categories, topClients, upcoming, kpi }: Props) {
  const [period, setPeriod] = useState<Period>("1y");
  const now = new Date();
  const topClientMax = topClients[0]?.total ?? 1;

  const periodMonths = PERIODS.find((p) => p.value === period)!.months;
  const filteredMonthly = monthly.slice(-periodMonths);

  return (
    <div className="py-5 space-y-4 pb-12 md:py-8 md:space-y-5">

      {/* ヘッダー */}
      <div>
        <p className="text-xs text-gray-400">{now.getFullYear()}年{now.getMonth() + 1}月</p>
        <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">財務サマリー</h1>
      </div>

      {/* KPI カード */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-[11px] text-gray-400 mb-1.5">今月の収入</p>
          <p className="text-lg font-bold text-blue-600 leading-tight">{fmt(kpi.income)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-[11px] text-gray-400 mb-1.5">今月の経費</p>
          <p className="text-lg font-bold text-red-500 leading-tight">{fmt(kpi.expense)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-[11px] text-gray-400 mb-1.5">純利益</p>
          <div className="flex items-center gap-1.5">
            {kpi.profit >= 0
              ? <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
              : <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />}
            <p className={`text-lg font-bold leading-tight ${kpi.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {kpi.profit < 0 ? "-" : ""}{fmt(kpi.profit)}
            </p>
          </div>
        </div>
        <Link href="/dashboard/invoices" className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-red-200 transition-colors block">
          <p className="text-[11px] text-gray-400 mb-1.5">未回収</p>
          <p className="text-lg font-bold text-orange-500 leading-tight">{fmt(kpi.unpaid)}</p>
          <p className="text-[10px] text-gray-400 mt-1">請求書へ →</p>
        </Link>
      </div>

      {/* 収支推移チャート */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm md:p-5">
        <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 mb-2">収支推移</h2>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="w-5 h-px bg-blue-500 inline-block" />収入
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <svg width="20" height="6" className="inline-block" style={{ verticalAlign: "middle" }}>
                  <line x1="0" y1="3" x2="20" y2="3" stroke="#F87171" strokeWidth="1.5" strokeDasharray="4,2" />
                </svg>
                経費
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="w-5 h-px bg-emerald-500 inline-block" />利益
              </span>
            </div>
          </div>

          {/* 期間セレクター */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-0.5 self-start">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all font-medium ${
                  period === p.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <LineChart data={filteredMonthly} />
      </div>

      {/* 下段: 経費内訳 + 取引先TOP5 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* 経費カテゴリ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm md:p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">経費内訳 <span className="text-xs text-gray-400 font-normal">（直近3ヶ月）</span></h2>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">経費データがありません</p>
          ) : (
            <div className="space-y-3">
              {categories.map((c) => (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700 flex items-center gap-1.5">
                      <span
                        className="inline-block w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[c.category] ?? "#6B7280" }}
                      />
                      {c.category}
                    </span>
                    <span className="text-xs text-gray-500">{fmt(c.amount)} <span className="text-gray-400">({c.percentage}%)</span></span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${c.percentage}%`,
                        backgroundColor: CATEGORY_COLORS[c.category] ?? "#6B7280",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 取引先 TOP5 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm md:p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">取引先別売上 <span className="text-xs text-gray-400 font-normal">（TOP 5）</span></h2>
          {topClients.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">データがありません</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((c, i) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700 flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-bold text-gray-400 shrink-0 w-4">#{i + 1}</span>
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="text-xs font-semibold text-gray-700 shrink-0 ml-2">{fmt(c.total)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-400 transition-all"
                      style={{ width: `${Math.round((c.total / topClientMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 入金予定 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">入金予定</h2>
          <Link href="/dashboard/invoices" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
            すべて見る <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">未払い請求書はありません</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcoming.map((inv) => {
              const due = inv.dueDate ? new Date(inv.dueDate) : null;
              const daysUntil = due ? Math.ceil((due.getTime() - Date.now()) / 86400000) : null;
              const isOverdue = inv.isOverdue;
              const isSoon = !isOverdue && daysUntil !== null && daysUntil <= 5;

              return (
                <Link
                  key={inv.id}
                  href={`/dashboard/invoices/${inv.id}`}
                  className="flex items-center justify-between py-3 hover:opacity-70 transition-opacity"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isOverdue ? (
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    ) : isSoon ? (
                      <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-300 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{inv.clientName}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {inv.invoiceNumber}
                        {due && (
                          <span className={`ml-2 ${isOverdue ? "text-red-500 font-medium" : isSoon ? "text-orange-400" : "text-gray-400"}`}>
                            {isOverdue
                              ? `${Math.abs(daysUntil!)}日超過`
                              : daysUntil === 0
                              ? "今日期限"
                              : `${daysUntil}日後`}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-gray-800">{fmt(inv.totalAmount)}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      inv.status === "部分払い"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-50 text-red-600"
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
