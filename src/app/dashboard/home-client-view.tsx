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
    <div className="p-8 space-y-8 pb-12">
      {/* 売上分析（そのまま） */}
      <SalesClientView {...salesProps} />

      {/* 今月のサマリー */}
      <section className="billia-card-elevated p-8">
        <p className="billia-label mb-4">今月のサマリー</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-sm text-billia-text-muted mb-2">今月の請求額</p>
            <p className="text-3xl md:text-4xl font-semibold tracking-tight text-billia-text">
              ¥{summary.currentMonthInvoiceAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-billia-text-muted mb-2">未入金</p>
            <Link
              href="/dashboard/invoices"
              className="text-3xl md:text-4xl font-semibold tracking-tight text-red-600 hover:text-red-700 transition-colors block"
            >
              ¥{summary.unpaidAmount.toLocaleString()}
            </Link>
            <p className="text-xs text-billia-text-muted mt-2">未払い一覧へ</p>
          </div>
          <div>
            <p className="text-sm text-billia-text-muted mb-2">今月の経費</p>
            <p className="text-3xl md:text-4xl font-semibold tracking-tight text-billia-text">
              ¥{summary.totalExpenses.toLocaleString()}
            </p>
            <p className="text-xs text-billia-text-muted mt-2">{summary.currentMonthYear}</p>
          </div>
        </div>
      </section>

      {/* 入出金レポート */}
      <section className="billia-card p-8">
        <p className="billia-label mb-2">入出金レポート</p>
        <h2 className="text-lg font-semibold text-billia-text mb-6">過去6ヶ月</h2>
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-sm bg-billia-blue" />
            <span className="text-sm text-billia-text-muted">請求</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-sm bg-red-500/90" />
            <span className="text-sm text-billia-text-muted">経費</span>
          </div>
        </div>
        <div className="h-52 flex items-end justify-between gap-2">
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
                  style={{ height: "140px" }}
                >
                  <div
                    className="w-1/2 rounded-t bg-billia-blue/90 min-h-[4px]"
                    style={{ height: `${Math.max(invoiceH, 4)}%` }}
                    title={`請求: ¥${data.invoiceAmount.toLocaleString()}`}
                  />
                  <div
                    className="w-1/2 rounded-t bg-red-500/90 min-h-[4px]"
                    style={{ height: `${Math.max(expenseH, 4)}%` }}
                    title={`経費: ¥${data.expenseAmount.toLocaleString()}`}
                  />
                </div>
                <span className="text-xs text-billia-text-muted">{month}月</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
