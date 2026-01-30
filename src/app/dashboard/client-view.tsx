"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Bell,
  User,
  Upload,
  FileText,
  Sparkles,
  Loader2,
  Receipt,
  DollarSign,
  Calendar,
  Plus,
  X,
} from "lucide-react";
import { readBankBookImage } from "@/app/actions/ocr";
import { getInvoiceByIdForDisplay } from "@/app/actions/invoice";
import { InvoiceTemplate } from "@/components/invoice-template";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";

type TenantGroup = {
  id: string;
  name: string;
  tenants: { id: string }[];
};

type Tenant = {
  id: string;
  name: string;
  nameKana: string;
  amount: number;
  groupId: string | null;
};

type Payment = {
  id: string;
  amount: number;
  date: string; // ISO string形式
  note: string | null;
  tenant: {
    id: string;
    name: string;
    nameKana: string;
    amount: number;
  };
};

type MonthlyData = {
  month: string;
  invoiceAmount: number;
  quoteAmount: number;
  paidAmount: number;
  expenseAmount: number;
};

type InvoiceStats = {
  paidCount: number;
  paidAmount: number;
  unpaidCount: number;
  unpaidAmount: number;
};

type InvoiceSummary = {
  id: string;
  totalAmount: number;
  client: { name: string };
};

type DashboardClientViewProps = {
  groups: TenantGroup[];
  tenants: Tenant[];
  currentMonthPayments: Payment[];
  selectedGroupId: string | null;
  currentMonthYear: string;
  monthlyARR: number;
  totalPaid: number;
  unpaidAmount: number;
  paidPercentage: number;
  clientCount: number;
  nextMonthExpected: number;
  totalExpenses: number;
  unpaidCount: number;
  monthlyData: MonthlyData[];
  invoiceStats: InvoiceStats;
  paidInvoices: InvoiceSummary[];
  unpaidInvoices: InvoiceSummary[];
};

export default function DashboardClientView({
  groups,
  tenants,
  currentMonthPayments,
  selectedGroupId,
  currentMonthYear,
  monthlyARR,
  totalPaid,
  unpaidAmount,
  paidPercentage,
  clientCount,
  nextMonthExpected,
  totalExpenses,
  unpaidCount,
  monthlyData,
  invoiceStats,
  paidInvoices,
  unpaidInvoices,
}: DashboardClientViewProps) {
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<Awaited<ReturnType<typeof getInvoiceByIdForDisplay>> | null>(null);
  const [invoiceDetailLoading, setInvoiceDetailLoading] = useState(false);

  useEffect(() => {
    if (!selectedInvoiceId) {
      setInvoiceDetail(null);
      return;
    }
    let cancelled = false;
    setInvoiceDetailLoading(true);
    setInvoiceDetail(null);
    getInvoiceByIdForDisplay(selectedInvoiceId).then((data) => {
      if (!cancelled) {
        setInvoiceDetail(data);
        setInvoiceDetailLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedInvoiceId]);

  const handleOCRButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingOCR(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await readBankBookImage(formData);

      if (result.success && result.data) {
        // 成功時の表示
        const message = `通帳読み取り成功！\n\n日付: ${result.data.date}\n金額: ¥${result.data.amount.toLocaleString()}\n名義: ${result.data.name}`;
        alert(message);
        console.log("OCR結果:", result.data);
      } else {
        // エラー時の表示
        alert(`エラー: ${result.message || "読み取りに失敗しました"}`);
        console.error("OCRエラー:", result.message);
      }
    } catch (error) {
      console.error("OCR処理エラー:", error);
      alert("予期しないエラーが発生しました。コンソールを確認してください。");
    } finally {
      setIsProcessingOCR(false);
      // ファイル入力のリセット（同じファイルを再度選択できるように）
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      {/* ヘッダー */}
      <header className="bg-billio-card border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-billio-text">ホーム</h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-billio-text-muted hover:text-billio-text transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-billio-blue to-billio-green flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツエリア */}
      <div className="p-6">
        {/* 重要アラート（未収がある場合のみ表示） */}
        {unpaidCount > 0 && unpaidAmount > 0 && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-900">
                  {unpaidCount}件の未入金があります（合計 ¥{unpaidAmount.toLocaleString()}）
                </p>
                <p className="text-xs text-red-700 mt-1">
                  早急な対応が必要です
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KPIカード（4枚構成） */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* 今月の売上（入金済） */}
          <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-billio-green/20 to-billio-blue/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-billio-green" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-billio-text-muted mb-2">
              今月の売上
            </p>
            <p className="text-3xl font-bold text-billio-text mb-1">
              ¥{totalPaid.toLocaleString()}
            </p>
            <p className="text-xs text-billio-text-muted">入金済</p>
          </div>

          {/* 今月の請求残（未収） */}
          <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-billio-text-muted mb-2">
              今月の請求残
            </p>
            <p className="text-3xl font-bold text-orange-600 mb-1">
              ¥{unpaidAmount.toLocaleString()}
            </p>
            <p className="text-xs text-billio-text-muted">
              {monthlyARR > 0
                ? `${Math.round((unpaidAmount / monthlyARR) * 100)}% 未回収`
                : "データなし"}
            </p>
          </div>

          {/* 来月の入金予定 */}
          <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-billio-blue/20 to-billio-green/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-billio-blue" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-billio-text-muted mb-2">
              来月の入金予定
            </p>
            <p className="text-3xl font-bold text-billio-text mb-1">
              ¥{nextMonthExpected.toLocaleString()}
            </p>
            <p className="text-xs text-billio-text-muted">確定分</p>
          </div>

          {/* 経費合計 */}
          <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-billio-text-muted mb-2">
              経費合計
            </p>
            <p className="text-3xl font-bold text-billio-text mb-1">
              ¥{totalExpenses.toLocaleString()}
            </p>
            <p className="text-xs text-billio-text-muted">{currentMonthYear}</p>
          </div>
        </div>

        {/* 請求書の状況（支払済・未払い） */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-billio-green/20 to-billio-blue/20 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-billio-green" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-billio-text-muted mb-2">
              請求書　支払済
            </p>
            <p className="text-2xl font-bold text-billio-text mb-3">
              {invoiceStats.paidCount}件　¥{invoiceStats.paidAmount.toLocaleString()}
            </p>
            <ul className="space-y-2 mb-3 max-h-32 overflow-y-auto">
              {paidInvoices.length === 0 ? (
                <li className="text-sm text-billio-text-muted">該当なし</li>
              ) : (
                paidInvoices.map((inv) => (
                  <li key={inv.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceId(inv.id)}
                      className="w-full text-left text-sm py-1.5 px-2 rounded-lg hover:bg-billio-green/10 text-billio-text flex justify-between items-center gap-2"
                    >
                      <span className="truncate">{inv.client.name}</span>
                      <span className="font-medium shrink-0">¥{inv.totalAmount.toLocaleString()}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
            <Link href="/dashboard/invoices" className="text-xs text-billio-text-muted hover:underline">
              一覧を見る →
            </Link>
          </div>
          <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-billio-text-muted mb-2">
              請求書　未払い
            </p>
            <p className="text-2xl font-bold text-orange-600 mb-3">
              {invoiceStats.unpaidCount}件　¥{invoiceStats.unpaidAmount.toLocaleString()}
            </p>
            <ul className="space-y-2 mb-3 max-h-32 overflow-y-auto">
              {unpaidInvoices.length === 0 ? (
                <li className="text-sm text-billio-text-muted">該当なし</li>
              ) : (
                unpaidInvoices.map((inv) => (
                  <li key={inv.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceId(inv.id)}
                      className="w-full text-left text-sm py-1.5 px-2 rounded-lg hover:bg-orange-100/50 text-billio-text flex justify-between items-center gap-2"
                    >
                      <span className="truncate">{inv.client.name}</span>
                      <span className="font-medium shrink-0">¥{inv.totalAmount.toLocaleString()}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
            <Link href="/dashboard/invoices" className="text-xs text-billio-text-muted hover:underline">
              一覧を見る →
            </Link>
          </div>
        </div>

        {/* 請求書プレビューモーダル（ページ遷移せず表示・×で閉じる） */}
        <Dialog open={selectedInvoiceId !== null} onOpenChange={(open) => !open && setSelectedInvoiceId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
            <div className="flex items-center justify-end p-2 border-b border-slate-200 shrink-0">
              <DialogClose asChild>
                <button
                  type="button"
                  aria-label="閉じる"
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </DialogClose>
            </div>
            <div className="overflow-auto flex-1 p-4 bg-slate-100">
              {invoiceDetailLoading && (
                <div className="flex items-center justify-center min-h-[200px]">
                  <Loader2 className="w-8 h-8 animate-spin text-billio-blue" />
                </div>
              )}
              {!invoiceDetailLoading && invoiceDetail && (
                <InvoiceTemplate
                  data={{
                    ...invoiceDetail,
                    issueDate: new Date(invoiceDetail.issueDate),
                    dueDate: new Date(invoiceDetail.dueDate),
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* メイングラフ */}
        <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-billio-text mb-4">
            月別推移
          </h2>
          {/* グラフのモックアップ（4本線） */}
          {(() => {
            // 最大値を計算（グラフのスケール用）
            const maxAmount = Math.max(
              ...monthlyData.map((d) =>
                Math.max(d.invoiceAmount, d.quoteAmount, d.paidAmount, d.expenseAmount)
              ),
              1
            );

            return (
              <>
                <div className="h-48 flex items-end justify-between gap-2">
                  {monthlyData.map((data, idx) => {
                    const invoiceHeight = (data.invoiceAmount / maxAmount) * 100;
                    const quoteHeight = (data.quoteAmount / maxAmount) * 100;
                    const paidHeight = (data.paidAmount / maxAmount) * 100;
                    const expenseHeight = (data.expenseAmount / maxAmount) * 100;
                    const [year, month] = data.month.split("-").map(Number);

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex items-end justify-center gap-0.5 mb-2 relative" style={{ height: "100%" }}>
                          {/* 請求 */}
                          <div
                            className="w-1/4 rounded-t bg-gradient-to-t from-billio-blue to-billio-blue-light"
                            style={{ height: `${invoiceHeight}%` }}
                            title={`請求: ¥${data.invoiceAmount.toLocaleString()}`}
                          />
                          {/* 見積もり */}
                          <div
                            className="w-1/4 rounded-t bg-gradient-to-t from-purple-500 to-purple-400"
                            style={{ height: `${quoteHeight}%` }}
                            title={`見積もり: ¥${data.quoteAmount.toLocaleString()}`}
                          />
                          {/* 入金済み */}
                          <div
                            className="w-1/4 rounded-t bg-gradient-to-t from-billio-green to-billio-green-light"
                            style={{ height: `${paidHeight}%` }}
                            title={`入金済み: ¥${data.paidAmount.toLocaleString()}`}
                          />
                          {/* 経費 */}
                          <div
                            className="w-1/4 rounded-t bg-gradient-to-t from-orange-500 to-orange-400"
                            style={{ height: `${expenseHeight}%` }}
                            title={`経費: ¥${data.expenseAmount.toLocaleString()}`}
                          />
                        </div>
                        <span className="text-xs text-billio-text-muted">
                          {month}月
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-billio-blue" />
                    <span className="text-xs text-billio-text-muted">請求</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500" />
                    <span className="text-xs text-billio-text-muted">見積もり</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-billio-green" />
                    <span className="text-xs text-billio-text-muted">入金済み</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500" />
                    <span className="text-xs text-billio-text-muted">経費</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* 未収アラート */}
        {unpaidCount > 0 && (
          <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-billio-text mb-4">
              未収アラート
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">
                    {unpaidCount}件の未入金があります
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    合計 ¥{unpaidAmount.toLocaleString()} の回収が必要です
                  </p>
                </div>
                <Link
                  href="/dashboard/ledger"
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  詳細を見る →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* クイックアクション */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/invoices/new"
            className="group flex items-center gap-4 rounded-xl bg-billio-card border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all hover:border-billio-blue"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-billio-blue/20 to-billio-green/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-billio-blue" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-billio-text group-hover:text-billio-blue transition-colors">
                請求書作成
              </h3>
              <p className="text-xs text-billio-text-muted">新規作成</p>
            </div>
          </Link>

          <Link
            href="/dashboard/expenses"
            className="group flex items-center gap-4 rounded-xl bg-billio-card border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all hover:border-billio-green"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-billio-green/20 to-billio-blue/20 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-6 h-6 text-billio-green" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-billio-text group-hover:text-billio-green transition-colors">
                経費登録
              </h3>
              <p className="text-xs text-billio-text-muted">経費を記録</p>
            </div>
          </Link>

          <Link
            href="/reconcile"
            className="group flex items-center gap-4 rounded-xl bg-billio-card border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all hover:border-billio-blue"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-billio-blue/20 to-billio-green/20 flex items-center justify-center flex-shrink-0">
              <Upload className="w-6 h-6 text-billio-blue" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-billio-text group-hover:text-billio-blue transition-colors">
                入金消込
              </h3>
              <p className="text-xs text-billio-text-muted">AIマッチング</p>
            </div>
          </Link>

          <div className="group flex items-center gap-4 rounded-xl bg-billio-card border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all hover:border-billio-green">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-billio-green/20 to-billio-blue/20 flex items-center justify-center flex-shrink-0">
              <Plus className="w-6 h-6 text-billio-green" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-billio-text group-hover:text-billio-green transition-colors">
                取引先追加
              </h3>
              <p className="text-xs text-billio-text-muted">新規登録</p>
            </div>
          </div>
        </div>

        {/* 隠しファイル入力（OCR用） */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </>
  );
}
