"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { importDocumentAndCreateQuote } from "@/app/actions/ocr";
import { FileText, Loader2 } from "lucide-react";
import { translateErrorMessage } from "@/lib/error-translator";

export default function ImportDocumentButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const processFile = async (file: File) => {
    // デバッグ情報
    console.log("処理するファイル:", {
      name: file.name,
      type: file.type || "不明",
      size: file.size,
    });

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await importDocumentAndCreateQuote(formData);
      if (result.success) {
        alert("見積書を作成しました！");
        router.refresh();
      } else {
        alert(result.message ?? "見積書の作成に失敗しました");
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
    const file = e.target.files?.[0];
    if (!file) return;
    
    e.target.value = ""; // リセット
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
            書類から見積書を作成
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
