"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { readReceiptImage } from "@/app/actions/ocr";
import type { ReceiptOCRData } from "@/app/actions/ocr";
import type { ExpenseInitialValues } from "./new-expense-dialog";
import NewExpenseDialog from "./new-expense-dialog";
import { Upload, Loader2 } from "lucide-react";
import { translateErrorMessage } from "@/lib/error-translator";

export const RECEIPT_OCR_PREFILL_KEY = "receiptOcrPrefill";

function receiptToInitialValues(data: ReceiptOCRData): ExpenseInitialValues {
  return {
    title: data.title,
    amount: data.amount,
    date: data.date,
    category: data.category,
  };
}

export default function ExpensesClient() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialValues, setInitialValues] = useState<ExpenseInitialValues | null>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      
      let result;
      try {
        result = await readReceiptImage(formData);
      } catch (serverError: any) {
        // Server Actionが例外をスローした場合
        console.error("Server Action error:", serverError);
        const errorMessage = serverError?.message || serverError?.toString() || "サーバーエラーが発生しました";
        alert(translateErrorMessage(errorMessage));
        return;
      }
      
      if (result.success && result.data) {
        setInitialValues(receiptToInitialValues(result.data));
        setDialogOpen(true);
      } else {
        // Server Actionから返されたエラーメッセージを表示
        const errorMessage = result.message ?? "領収書・レシートの読み込みに失敗しました";
        alert(translateErrorMessage(errorMessage));
      }
    } catch (err) {
      // 予期しないエラー
      console.error("Unexpected error:", err);
      const errorMessage = err instanceof Error ? err.message : "エラーが発生しました";
      const japaneseMessage = translateErrorMessage(errorMessage);
      alert(japaneseMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`mt-6 rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
          isDragOver
            ? "border-blue-500 bg-blue-50"
            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
        } ${isProcessing ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        {isProcessing ? (
          <>
            <Loader2 className="h-12 w-12 mx-auto text-blue-600 animate-spin mb-4" />
            <p className="font-semibold text-slate-900">読み込み中...</p>
            <p className="text-sm text-slate-500 mt-1">AIがレシート・領収書を解析しています</p>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <p className="font-semibold text-slate-900">
              レシート・領収書・請求書をドラッグ&ドロップ
            </p>
            <p className="text-sm text-slate-500 mt-1">
              またはクリックしてファイルを選択（PDF、画像対応）
            </p>
            <p className="text-xs text-slate-400 mt-2">
              AIが自動で経費情報を抽出します
            </p>
          </>
        )}
      </div>
      <NewExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialValues={initialValues}
      />
    </>
  );
}

