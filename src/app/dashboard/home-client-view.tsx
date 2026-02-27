"use client";

import Link from "next/link";
import {
  FileText,
  ClipboardList,
  Receipt,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import type SalesClientView from "./sales/sales-client-view";

type SalesProps = React.ComponentProps<typeof SalesClientView>;

type Summary = {
  currentMonthInvoiceAmount: number;
  unpaidAmount: number;
  totalExpenses: number;
  currentMonthYear: string;
};

type MonthlyData = {
  month: string;
  invoiceAmount: number;
  quoteAmount: number;
  paidAmount: number;
  expenseAmount: number;
};

type Props = {
  salesProps: SalesProps;
  summary: Summary;
  monthlyData: MonthlyData[];
};

const formatCurrency = (n: number) =>
  "¥" + new Intl.NumberFormat("ja-JP").format(n);

export default function HomeClientView({ salesProps, summary, monthlyData }: Props) {
  const { kpi, recentInvoices, currentMonth } = salesProps;
  const [year, month] = currentMonth.split("-").map(Number);

  const maxChart = Math.max(
    ...monthlyData.map((d) => Math.max(d.invoiceAmount, d.expenseAmount)),
    1
  );

  return (
    <div className="py-4 space-y-4 pb-12 md:py-8 md:space-y-5">

      {/* ページヘッダー */}
      <div>
        <p className="text-xs text-billia-text-muted">{year}年{month}月</p>
        <h1 className="text-xl font-semibold text-billia-text md:text-2xl">ダッシュボード</h1>
      </div>

      {/* 未入金アラート（金額がある場合のみ） */}
      {summary.unpaidAmount > 0 && (
        <Link
          href="/dashboard/invoices"
          className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 hover:bg-red-100 transition-colors"
        >
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-700">未入金があります</p>
            <p className="text-xs text-red-500 mt-0.5">
              {formatCurrency(summary.unpaidAmount)} — タップして確認
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-red-400 shrink-0" />
        </Link>
      )}

      {/* KPI カード */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="billia-card p-4 md:p-5">
          <p className="text-[11px] text-billia-text-muted mb-2">今月の請求額</p>
          <p className="text-base font-bold text-billia-text leading-tight md:text-2xl md:font-semibold">
            {formatCurrency(summary.currentMonthInvoiceAmount)}
          </p>
          <p className="text-[10px] text-billia-text-muted mt-1">{summary.currentMonthYear}</p>
        </div>

        <Link href="/dashboard/invoices" className="billia-card p-4 md:p-5 block hover:border-red-200 transition-colors">
          <p className="text-[11px] text-billia-text-muted mb-2">未入金</p>
          <p className="text-base font-bold text-red-600 leading-tight md:text-2xl md:font-semibold">
            {formatCurrency(summary.unpaidAmount)}
          </p>
          <p className="text-[10px] text-red-400 mt-1">請求書へ →</p>
        </Link>

        <div className="billia-card p-4 md:p-5">
          <p className="text-[11px] text-billia-text-muted mb-2">今月の経費</p>
          <p className="text-base font-bold text-billia-text leading-tight md:text-2xl md:font-semibold">
            {formatCurrency(summary.totalExpenses)}
          </p>
          <p className="text-[10px] text-billia-text-muted mt-1">経費合計</p>
        </div>

        <div className="billia-card p-4 md:p-5">
          <p className="text-[11px] text-billia-text-muted mb-2">前月比</p>
          <p
            className={`text-base font-bold leading-tight md:text-2xl md:font-semibold ${
              kpi.growthRate >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {kpi.growthRate >= 0 ? "+" : ""}
            {kpi.growthRate.toFixed(1)}%
          </p>
          <p className="text-[10px] text-billia-text-muted mt-1 flex items-center gap-0.5">
            {kpi.growthRate >= 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            カテゴリ売上
          </p>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="billia-card p-4 md:p-5">
        <p className="text-xs font-medium text-billia-text-muted mb-3 uppercase tracking-wide">
          クイックアクション
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Link
            href="/dashboard/invoices/new"
            className="flex flex-col items-center gap-2 rounded-2xl border border-billia-border p-3 hover:bg-blue-50 hover:border-blue-200 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-billia-blue" />
            </div>
            <span className="text-xs font-medium text-billia-text text-center leading-tight">
              請求書を作成
            </span>
          </Link>

          <Link
            href="/dashboard/quotes/new"
            className="flex flex-col items-center gap-2 rounded-2xl border border-billia-border p-3 hover:bg-purple-50 hover:border-purple-200 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-billia-text text-center leading-tight">
              見積書を作成
            </span>
          </Link>

          <Link
            href="/dashboard/expenses"
            className="flex flex-col items-center gap-2 rounded-2xl border border-billia-border p-3 hover:bg-orange-50 hover:border-orange-200 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-xs font-medium text-billia-text text-center leading-tight">
              経費を記録
            </span>
          </Link>

          <Link
            href="/reconcile"
            className="flex flex-col items-center gap-2 rounded-2xl border border-billia-border p-3 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-billia-text text-center leading-tight">
              入金消込
            </span>
          </Link>
        </div>
      </div>

      {/* 最近の請求書 */}
      {recentInvoices.length > 0 && (
        <div className="billia-card p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-billia-text">最近の請求書</h2>
            <Link
              href="/dashboard/invoices"
              className="text-xs text-billia-blue flex items-center gap-0.5 hover:underline"
            >
              すべて見る
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-billia-border-subtle">
            {recentInvoices.slice(0, 5).map((inv) => (
              <Link
                key={inv.id}
                href={`/dashboard/invoices/${inv.id}`}
                className="flex items-center justify-between py-3 hover:opacity-70 transition-opacity"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-billia-text truncate">
                    {inv.clientName}
                  </p>
                  <p className="text-xs text-billia-text-muted mt-0.5">
                    {new Date(inv.issueDate).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <p className="text-sm font-semibold text-billia-text shrink-0 ml-3">
                  {formatCurrency(inv.totalAmount)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 6ヶ月収支チャート */}
      <div className="billia-card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-billia-text">過去6ヶ月の収支</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-billia-blue" />
              <span className="text-[11px] text-billia-text-muted">請求</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
              <span className="text-[11px] text-billia-text-muted">経費</span>
            </div>
          </div>
        </div>
        <div className="h-36 flex items-end justify-between gap-1.5 md:h-48 md:gap-2">
          {monthlyData.map((data, idx) => {
            const invoiceH = (data.invoiceAmount / maxChart) * 100;
            const expenseH = (data.expenseAmount / maxChart) * 100;
            const [, m] = data.month.split("-").map(Number);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full flex items-end justify-center gap-0.5"
                  style={{ height: "110px" }}
                >
                  <div
                    className="w-[45%] rounded-t bg-billia-blue/80 min-h-[3px] transition-all"
                    style={{ height: `${Math.max(invoiceH, 3)}%` }}
                    title={`請求: ${formatCurrency(data.invoiceAmount)}`}
                  />
                  <div
                    className="w-[45%] rounded-t bg-red-400/80 min-h-[3px] transition-all"
                    style={{ height: `${Math.max(expenseH, 3)}%` }}
                    title={`経費: ${formatCurrency(data.expenseAmount)}`}
                  />
                </div>
                <span className="text-[10px] text-billia-text-muted">{m}月</span>
              </div>
            );
          })}
        </div>
        {/* 金額軸ラベル */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-billia-border-subtle">
          <span className="text-[10px] text-billia-text-muted">
            最大: {formatCurrency(maxChart)}
          </span>
          <Link href="/dashboard/sales" className="text-[11px] text-billia-blue hover:underline flex items-center gap-0.5">
            詳細分析 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

    </div>
  );
}
