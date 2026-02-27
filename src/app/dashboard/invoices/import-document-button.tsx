"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { importDocument } from "@/app/actions/ocr-document";
import { FileText, Loader2 } from "lucide-react";
import { translateErrorMessage } from "@/lib/error-translator";

const INVOICE_OCR_STORAGE_KEY = "invoiceOcrPrefill";

export default function ImportDocumentButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const processFiles = async (files: File[]) => {
    const MAX_FILES = 15;
    if (files.length > MAX_FILES) {
      alert(`一度に${MAX_FILES}件まで選択できます（${files.length}件選択されています）`);
      return;
    }

    setIsProcessing(true);
    try {
      const results: Array<{ data: any; fileName: string }> = [];
      const errors: Array<{ fileName: string; message: string }> = [];

      for (const file of files) {
        try {
          const formData = new FormData();
          formData.set("file", file);
          const result = await importDocument(formData, "invoice");
          if (result.success && result.data) {
            results.push({ data: result.data, fileName: file.name });
          } else {
            errors.push({ fileName: file.name, message: result.message ?? "読み込みに失敗しました" });
          }
        } catch (err) {
          console.error("エラー:", err);
          const errorMessage = err instanceof Error ? err.message : "エラーが発生しました";
          errors.push({ fileName: file.name, message: translateErrorMessage(errorMessage) });
        }
      }

      // エラーがある場合は通知
      if (errors.length > 0) {
        const errorMsg = errors.map((e) => `・${e.fileName}: ${e.message}`).join("\n");
        alert(`以下のファイルでエラーが発生しました:\n\n${errorMsg}`);
      }

      // 成功した結果がある場合、最初の1件を編集画面で開く
      if (results.length > 0) {
        sessionStorage.setItem(INVOICE_OCR_STORAGE_KEY, JSON.stringify(results[0].data));
        // 複数ファイルがある場合は、残りをキューに保存
        if (results.length > 1) {
          sessionStorage.setItem(
            INVOICE_OCR_STORAGE_KEY + "_queue",
            JSON.stringify(results.slice(1))
          );
        }
        router.push("/dashboard/invoices/new?fromOcr=1");
      } else if (errors.length === files.length) {
        alert("すべてのファイルの読み込みに失敗しました");
      }
    } catch (err) {
      console.error("エラー:", err);
      const errorMessage = err instanceof Error ? err.message : "エラーが発生しました";
      alert(translateErrorMessage(errorMessage));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    
    e.target.value = ""; // リセット
    await processFiles(files);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length === 0) return;
    
    await processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className="relative"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.xlsx,.xls,.docx,.doc,.txt,.csv,image/*,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isProcessing}
        className={`inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 ${
          isDragOver ? "ring-2 ring-blue-500" : ""
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            処理中...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            書類から請求書を作成（複数可）
          </>
        )}
      </button>
      {isDragOver && (
        <div className="absolute inset-0 rounded-full bg-blue-100 border-2 border-blue-500 border-dashed flex items-center justify-center z-10">
          <span className="text-xs font-medium text-blue-700">ここにファイルをドロップ</span>
        </div>
      )}
    </div>
  );
}
