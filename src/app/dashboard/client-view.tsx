"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  AlertTriangle,
  Upload,
  FileText,
  Loader2,
  DollarSign,
  X,
  ScanLine,
  PenLine,
  Lightbulb,
} from "lucide-react";
import { readInvoiceImage, readReceiptImage } from "@/app/actions/ocr";
import { translateErrorMessage } from "@/lib/error-translator";
import { RECEIPT_OCR_PREFILL_KEY } from "@/app/dashboard/expenses/read-receipt-ocr-button";
import { STORAGE_KEY as INVOICE_OCR_STORAGE_KEY } from "@/app/dashboard/invoices/read-invoice-ocr-button";
import { getInvoiceByIdForDisplay } from "@/app/actions/invoice";
import { InvoiceTemplate } from "@/components/invoice-template";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

type TenantGroup = { id: string; name: string; tenants: { id: string }[] };
type Tenant = { id: string; name: string; nameKana: string; amount: number; groupId: string | null };
type Payment = {
  id: string;
  amount: number;
  date: string;
  note: string | null;
  tenant: { id: string; name: string; nameKana: string; amount: number };
};
type MonthlyData = {
  month: string;
  invoiceAmount: number;
  quoteAmount: number;
  paidAmount: number;
  expenseAmount: number;
};
type InvoiceStats = { paidCount: number; paidAmount: number; unpaidCount: number; unpaidAmount: number };
type InvoiceSummary = { id: string; totalAmount: number; client: { name: string } };
type OverdueInvoice = InvoiceSummary & { dueDate: string; issueDate: string };

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
  totalExpenses: number;
  unpaidCount: number;
  monthlyData: MonthlyData[];
  invoiceStats: InvoiceStats;
  paidInvoices: InvoiceSummary[];
  unpaidInvoices: InvoiceSummary[];
  overdueInvoices: OverdueInvoice[];
  currentMonthInvoiceAmount: number;
};

export default function DashboardClientView({
  currentMonthPayments,
  currentMonthYear,
  totalExpenses,
  monthlyData,
  invoiceStats,
  paidInvoices,
  unpaidInvoices,
  overdueInvoices,
  currentMonthInvoiceAmount,
}: DashboardClientViewProps) {
  const router = useRouter();
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [showOcrChoice, setShowOcrChoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<Awaited<ReturnType<typeof getInvoiceByIdForDisplay>> | null>(null);
  const [invoiceDetailLoading, setInvoiceDetailLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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

  const runOcrAs = async (type: "invoice" | "receipt") => {
    if (!ocrFile) return;
    setIsProcessingOCR(true);
    setShowOcrChoice(false);
    const formData = new FormData();
    formData.set("file", ocrFile);
    setOcrFile(null);
    try {
      if (type === "invoice") {
        const result = await readInvoiceImage(formData);
        if (result.success && result.data) {
          sessionStorage.setItem(INVOICE_OCR_STORAGE_KEY, JSON.stringify(result.data));
          router.push("/dashboard/invoices/new?fromOcr=1");
        } else {
          alert(result.message ?? "請求書の読み込みに失敗しました");
        }
      } else {
        const result = await readReceiptImage(formData);
        if (result.success && result.data) {
          sessionStorage.setItem(RECEIPT_OCR_PREFILL_KEY, JSON.stringify(result.data));
          router.push("/dashboard/expenses?openReceipt=1");
        } else {
          alert(result.message ?? "領収書の読み込みに失敗しました");
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "エラーが発生しました";
      alert(translateErrorMessage(errorMessage));
    } finally {
      setIsProcessingOCR(false);
      fileInputRef.current && (fileInputRef.current.value = "");
    }
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    const isImage = fileType.startsWith("image/") || fileName.match(/\.(jpg|jpeg|png|gif|webp)$/);
    const isPdf = fileType === "application/pdf" || fileName.endsWith(".pdf");
    
    if (!isImage && !isPdf) {
      alert("画像ファイル（JPEG、PNG、GIF、WebP）またはPDFファイルを選択してください");
      return;
    }
    
    setOcrFile(file);
    setShowOcrChoice(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  const formatMonth = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}月`;
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* 1. KPI エリア（最上部） */}
        <section className="glass-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-500 mb-1">今月の請求額</p>
              <p className="text-3xl md:text-4xl font-bold text-slate-900">
                ¥{currentMonthInvoiceAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">未入金（重要）</p>
              <Link
                href="/dashboard/invoices"
                className="text-3xl md:text-4xl font-bold text-red-600 hover:text-red-700 hover:underline block"
              >
                ¥{invoiceStats.unpaidAmount.toLocaleString()}
              </Link>
              <p className="text-xs text-slate-500 mt-1">クリックで未払い一覧へ</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">今月の経費</p>
              <p className="text-3xl md:text-4xl font-bold text-slate-900">
                ¥{totalExpenses.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">{currentMonthYear}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 2. クイックアクション（右側・目立つ場所） */}
          <section className="lg:col-span-1 order-2 lg:order-1">
            <div className="glass-card p-6 space-y-4">
              <p className="text-sm font-semibold text-slate-700">クイックアクション</p>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-billio-blue bg-billio-blue/5"
                    : "border-slate-200 hover:border-billio-blue/50 hover:bg-slate-50/80"
                } ${isProcessingOCR ? "pointer-events-none opacity-70" : ""}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf,image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
                {isProcessingOCR ? (
                  <Loader2 className="w-12 h-12 mx-auto text-billio-blue animate-spin mb-2" />
                ) : (
                  <ScanLine className="w-12 h-12 mx-auto text-billio-blue mb-2" />
                )}
                <p className="font-semibold text-slate-900">
                  AIスキャン（領収書・請求書）
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  ファイルをドラッグ＆ドロップ
                </p>
              </div>
              <Link
                href="/dashboard/invoices/new"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-billio-blue text-white py-3 px-4 font-semibold hover:bg-billio-blue-dark transition-colors"
              >
                <PenLine className="w-5 h-5" />
                請求書作成
              </Link>
            </div>
          </section>

          {/* 3. タスク・通知エリア（左側：AIアシスタント風） */}
          <section className="lg:col-span-2 order-1 lg:order-2">
            <div className="glass-card p-6">
              <p className="text-sm font-semibold text-slate-700 mb-4">タスク・通知</p>
              <ul className="space-y-3">
                {overdueInvoices.length > 0 &&
                  overdueInvoices.slice(0, 3).map((inv) => (
                    <li key={inv.id}>
                      <Link
                        href="/dashboard/invoices"
                        className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-800 hover:bg-red-100/80 transition-colors"
                      >
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <span className="text-sm">
                          🚨 {inv.client.name}の請求書（{formatMonth(inv.issueDate)}分）の支払期限が過ぎています
                        </span>
                      </Link>
                    </li>
                  ))}
                <li>
                  <Link
                    href="/dashboard/expenses"
                    className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 hover:bg-amber-100/80 transition-colors"
                  >
                    <Lightbulb className="w-5 h-5 shrink-0" />
                    <span className="text-sm">
                      💡 領収書をスキャンして経費登録しますか？
                    </span>
                  </Link>
                </li>
                {currentMonthPayments.slice(0, 3).map((p) => (
                  <li key={p.id}>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800">
                      <DollarSign className="w-5 h-5 shrink-0 text-emerald-600" />
                      <span className="text-sm">
                        💰 {p.tenant.name}から{p.amount.toLocaleString()}円の入金がありました（消込完了）
                      </span>
                    </div>
                  </li>
                ))}
                {overdueInvoices.length === 0 && currentMonthPayments.length === 0 && (
                  <li className="text-sm text-slate-500 p-3">通知はありません</li>
                )}
              </ul>
            </div>
          </section>
        </div>

        {/* 4. 推移グラフ（下部：入出金レポート） */}
        <section className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">入出金レポート（過去6ヶ月）</h2>
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-billio-blue" />
              <span className="text-sm text-slate-600">請求</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-sm text-slate-600">経費</span>
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
                      className="w-1/2 rounded-t bg-billio-blue/90 min-h-[4px]"
                      style={{ height: `${Math.max(invoiceH, 4)}%` }}
                      title={`請求: ¥${data.invoiceAmount.toLocaleString()}`}
                    />
                    <div
                      className="w-1/2 rounded-t bg-red-500/90 min-h-[4px]"
                      style={{ height: `${Math.max(expenseH, 4)}%` }}
                      title={`経費: ¥${data.expenseAmount.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{month}月</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* OCR 種類選択モーダル */}
      <Dialog open={showOcrChoice} onOpenChange={setShowOcrChoice}>
        <DialogContent className="sm:max-w-sm">
          <p className="font-semibold text-slate-900 mb-4">どの書類として読み込みますか？</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => runOcrAs("invoice")}
              disabled={isProcessingOCR}
              className="flex-1 py-3 px-4 rounded-xl bg-billio-blue text-white font-medium hover:bg-billio-blue-dark transition-colors disabled:opacity-50"
            >
              請求書
            </button>
            <button
              type="button"
              onClick={() => runOcrAs("receipt")}
              disabled={isProcessingOCR}
              className="flex-1 py-3 px-4 rounded-xl bg-billio-green text-white font-medium hover:bg-billio-green-dark transition-colors disabled:opacity-50"
            >
              領収書
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 請求書プレビューモーダル */}
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
    </>
  );
}
