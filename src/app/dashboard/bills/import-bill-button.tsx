"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { importDocumentAndCreateBill } from "@/app/actions/ocr-document";
import { ScanLine, Loader2, UploadCloud } from "lucide-react";

export default function ImportBillButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const processFiles = async (files: File[]) => {
    const MAX_FILES = 15;
    if (files.length > MAX_FILES) {
      alert(`一度に${MAX_FILES}件まで選択できます（${files.length}件選択されています）`);
      return;
    }

    setIsProcessing(true);
    setProgress({ done: 0, total: files.length });

    const successes: string[] = [];
    const errors: { fileName: string; message: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.set("file", file);
        const result = await importDocumentAndCreateBill(formData);
        if (result.success && result.data) {
          successes.push(`${result.data.vendorName} / ${result.data.title}`);
        } else {
          errors.push({ fileName: file.name, message: result.message ?? "読み込みに失敗しました" });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "エラーが発生しました";
        errors.push({ fileName: file.name, message: msg });
      }
      setProgress({ done: i + 1, total: files.length });
    }

    setIsProcessing(false);
    setProgress(null);

    if (errors.length > 0) {
      const errMsg = errors.map((e) => `・${e.fileName}: ${e.message}`).join("\n");
      alert(`以下のファイルでエラーが発生しました:\n\n${errMsg}`);
    }

    if (successes.length > 0) {
      alert(`${successes.length}件の請求書を登録しました:\n\n${successes.map((s) => `・${s}`).join("\n")}`);
      router.refresh();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    await processFiles(files);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length === 0) return;
    await processFiles(files);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
      className="relative"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isProcessing}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-billia-border bg-white px-3 py-2 text-xs font-medium text-billia-text transition-colors hover:bg-billia-bg disabled:opacity-50 md:px-4 md:py-2.5 md:text-sm ${
          isDragOver ? "ring-2 ring-billia-blue bg-billia-blue/5" : ""
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {progress
              ? `読み取り中... ${progress.done}/${progress.total}`
              : "処理中..."}
          </>
        ) : (
          <>
            <ScanLine className="w-4 h-4" />
            書類から読み取り
          </>
        )}
      </button>

      {isDragOver && (
        <div className="absolute inset-0 rounded-xl bg-billia-blue/10 border-2 border-billia-blue border-dashed flex items-center justify-center z-10 pointer-events-none">
          <div className="flex flex-col items-center gap-1">
            <UploadCloud className="w-5 h-5 text-billia-blue" />
            <span className="text-xs font-medium text-billia-blue">ドロップして読み取り</span>
          </div>
        </div>
      )}
    </div>
  );
}
