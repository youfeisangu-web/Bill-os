"use client";

import Link from "next/link";
import SalesClientView from "./sales/sales-client-view";

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

export default function HomeClientView({ salesProps, summary, monthlyData }: Props) {
  return (
    <div className="py-4 space-y-4 pb-10 md:py-8 md:space-y-6">
      {/* 売上分析 */}
      <SalesClientView {...salesProps} />

      {/* 今月のサマリー */}
      <section className="billia-card p-4 md:p-6">
        <p className="text-[10px] uppercase tracking-widest text-billia-text-muted mb-3">
          今月のサマリー
        </p>
        <div className="grid grid-cols-3 gap-2 md:gap-8">
          <div className="min-w-0">
            <p className="text-[11px] text-billia-text-muted mb-1 truncate">今月の請求額</p>
            <p className="text-sm font-semibold text-billia-text leading-snug md:text-3xl">
              ¥{summary.currentMonthInvoiceAmount.toLocaleString()}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-billia-text-muted mb-1">未入金</p>
            <Link
              href="/dashboard/invoices"
              className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors block leading-snug md:text-3xl"
            >
              ¥{summary.unpaidAmount.toLocaleString()}
            </Link>
            <p className="text-[10px] text-billia-text-muted mt-1 hidden md:block">未払い一覧へ</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-billia-text-muted mb-1 truncate">今月の経費</p>
            <p className="text-sm font-semibold text-billia-text leading-snug md:text-3xl">
              ¥{summary.totalExpenses.toLocaleString()}
            </p>
            <p className="text-[10px] text-billia-text-muted mt-1 hidden md:block">
              {summary.currentMonthYear}
            </p>
          </div>
        </div>
      </section>

      {/* 入出金レポート */}
      <section className="billia-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-3 md:mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-billia-text-muted mb-0.5 hidden md:block">
              入出金レポート
            </p>
            <h2 className="text-sm font-semibold text-billia-text md:text-lg">過去6ヶ月</h2>
          </div>
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
        <div className="h-32 flex items-end justify-between gap-1 md:h-48 md:gap-2">
          {monthlyData.map((data, idx) => {
            const maxAmount = Math.max(
              ...monthlyData.map((d) => Math.max(d.invoiceAmount, d.expenseAmount)),
              1
            );
            const invoiceH = (data.invoiceAmount / maxAmount) * 100;
            const expenseH = (data.expenseAmount / maxAmount) * 100;
            const [, month] = data.month.split("-").map(Number);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full flex items-end justify-center gap-0.5"
                  style={{ height: "88px" }}
                >
                  <div
                    className="w-1/2 rounded-t bg-billia-blue/80 min-h-[3px]"
                    style={{ height: `${Math.max(invoiceH, 3)}%` }}
                    title={`請求: ¥${data.invoiceAmount.toLocaleString()}`}
                  />
                  <div
                    className="w-1/2 rounded-t bg-red-400/80 min-h-[3px]"
                    style={{ height: `${Math.max(expenseH, 3)}%` }}
                    title={`経費: ¥${data.expenseAmount.toLocaleString()}`}
                  />
                </div>
                <span className="text-[10px] text-billia-text-muted">{month}月</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
