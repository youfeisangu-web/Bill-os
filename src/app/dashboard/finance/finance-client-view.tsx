"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, AlertCircle, ArrowRight, Clock } from "lucide-react";
import type {
  MonthlyFinancial,
  CategoryExpense,
  TopClient,
  UpcomingPayment,
  FinanceKPI,
} from "@/app/actions/finance";

type Props = {
  monthly: MonthlyFinancial[];
  categories: CategoryExpense[];
  topClients: TopClient[];
  upcoming: UpcomingPayment[];
  kpi: FinanceKPI;
};

const fmt = (n: number) => "¥" + new Intl.NumberFormat("ja-JP").format(Math.abs(n));
const fmtCompact = (n: number) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}¥${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}¥${Math.round(abs / 1_000)}K`;
  return `${sign}¥${abs}`;
};

const CATEGORY_COLORS: Record<string, string> = {
  通信費: "#3B82F6",
  外注費: "#8B5CF6",
  消耗品: "#F59E0B",
  旅費交通費: "#F97316",
  地代家賃: "#06B6D4",
  広告宣伝費: "#EC4899",
  その他: "#6B7280",
};

// ─── SVG 線グラフ ────────────────────────────────────────────────
function LineChart({ data }: { data: MonthlyFinancial[] }) {
  if (data.length < 2) return <div className="h-40 flex items-center justify-center text-sm text-gray-400">データがありません</div>;

  const W = 500, H = 170;
  const pad = { l: 58, t: 20, r: 18, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const allVals = data.flatMap((d) => [d.income, d.expense, d.profit]);
  const minVal = Math.min(0, ...allVals);
  const maxVal = Math.max(1, ...allVals);
  const range = maxVal - minVal || 1;

  const xAt = (i: number) => pad.l + (i / (data.length - 1)) * iw;
  const yAt = (v: number) => pad.t + (1 - (v - minVal) / range) * ih;
  const zeroY = yAt(0);

  const pts = (key: keyof MonthlyFinancial) =>
    data.map((d, i) => `${xAt(i)},${yAt(d[key] as number)}`).join(" ");

  const incomeArea =
    `${xAt(0)},${zeroY} ` +
    data.map((d, i) => `${xAt(i)},${yAt(d.income)}`).join(" ") +
    ` ${xAt(data.length - 1)},${zeroY}`;

  // Y軸グリッド（3本）
  const gridSteps = [0, 0.5, 1].map((t) => {
    const v = minVal + t * range;
    return { y: yAt(v), label: fmtCompact(v) };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* グリッド */}
      {gridSteps.map(({ y, label }, i) => (
        <g key={i}>
          <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "4,3"} />
          <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{label}</text>
        </g>
      ))}

      {/* 0ライン（利益がマイナスの場合のみ強調） */}
      {minVal < 0 && (
        <line x1={pad.l} y1={zeroY} x2={W - pad.r} y2={zeroY} stroke="#d1d5db" strokeWidth="1.5" />
      )}

      {/* 収入エリア塗り */}
      <polygon points={incomeArea} fill="url(#incomeGrad)" />

      {/* 経費ライン */}
      <polyline points={pts("expense")} fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,3" />

      {/* 利益ライン */}
      <polyline points={pts("profit")} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* 収入ライン（最前面） */}
      <polyline points={pts("income")} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* 収入ドット */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xAt(i)} cy={yAt(d.income)} r="4" fill="white" stroke="#3B82F6" strokeWidth="2" />
        </g>
      ))}

      {/* X軸ラベル */}
      {data.map((d, i) => {
        const [, m] = d.month.split("-").map(Number);
        return (
          <text key={i} x={xAt(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="#9ca3af">
            {m}月
          </text>
        );
      })}
    </svg>
  );
}

// ─── メインビュー ─────────────────────────────────────────────────
export default function FinanceClientView({ monthly, categories, topClients, upcoming, kpi }: Props) {
  const now = new Date();
  const topClientMax = topClients[0]?.total ?? 1;

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

      {/* 収支推移 線グラフ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">収支推移（6ヶ月）</h2>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="w-5 h-0.5 bg-blue-500 inline-block rounded" />収入
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="w-5 h-0.5 bg-red-400 inline-block rounded border-dashed" style={{ borderTop: "2px dashed #F87171", background: "transparent" }} />経費
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="w-5 h-0.5 bg-emerald-500 inline-block rounded" />利益
            </span>
          </div>
        </div>
        <LineChart data={monthly} />
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
