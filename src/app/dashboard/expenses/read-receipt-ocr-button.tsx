"use client";

import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { readReceiptImage } from "@/app/actions/ocr";
import type { ReceiptOCRData } from "@/app/actions/ocr";
import type { ExpenseInitialValues } from "./new-expense-dialog";
import NewExpenseDialog from "./new-expense-dialog";

export const RECEIPT_OCR_PREFILL_KEY = "receiptOcrPrefill";

function receiptToInitialValues(data: ReceiptOCRData): ExpenseInitialValues {
  return {
    title: data.title,
    amount: data.amount,
    date: data.date,
    category: data.category,
  };
}

export default function ReadReceiptOcrButton() {
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialValues, setInitialValues] = useState<ExpenseInitialValues | null>(null);

  useEffect(() => {
    if (searchParams.get("openReceipt") !== "1") return;
    try {
      const raw = sessionStorage.getItem(RECEIPT_OCR_PREFILL_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as ReceiptOCRData;
      sessionStorage.removeItem(RECEIPT_OCR_PREFILL_KEY);
      setInitialValues(receiptToInitialValues(data));
      setDialogOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
    } catch {
      // ignore
    }
  }, [searchParams]);

  const handleOcrClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await readReceiptImage(formData);
      if (result.success && result.data) {
        setInitialValues(receiptToInitialValues(result.data));
        setDialogOpen(true);
      } else {
        alert(result.message ?? "領収書の読み込みに失敗しました");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenRegister = () => {
    setInitialValues(null);
    setDialogOpen(true);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleOcrClick}
          disabled={isProcessing}
          className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          {isProcessing ? "読み込み中..." : "領収書・請求書を読み込み"}
        </button>
        <button
          type="button"
          onClick={handleOpenRegister}
          className="inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          経費を登録
        </button>
        <NewExpenseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initialValues={initialValues}
        />
      </div>
    </>
  );
}
