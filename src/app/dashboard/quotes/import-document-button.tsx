"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { importDocumentAndCreateQuote } from "@/app/actions/ocr";
import { FileText, Loader2 } from "lucide-react";

export default function ImportDocumentButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = () => {
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
      const result = await importDocumentAndCreateQuote(formData);
      if (result.success) {
        alert("見積書を作成しました！");
        router.refresh();
      } else {
        alert(result.message ?? "見積書の作成に失敗しました");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isProcessing}
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
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
    </>
  );
}
