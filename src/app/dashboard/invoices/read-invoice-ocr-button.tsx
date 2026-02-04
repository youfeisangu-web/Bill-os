"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { readInvoiceImage } from "@/app/actions/ocr";
import { translateErrorMessage } from "@/lib/error-translator";
const STORAGE_KEY = "invoiceOcrPrefill";

export default function ReadInvoiceOcrButton() {
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
      const result = await readInvoiceImage(formData);
      if (result.success && result.data) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
        router.push("/dashboard/invoices/new?fromOcr=1");
      } else {
        alert(result.message ?? "請求書の読み込みに失敗しました");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "エラーが発生しました";
      alert(translateErrorMessage(errorMessage));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isProcessing}
        className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
      >
        {isProcessing ? "読み込み中..." : "請求書を読み込み"}
      </button>
    </>
  );
}

export { STORAGE_KEY };
