"use client";

import { useTransition } from "react";
import { convertQuoteToInvoice } from "@/app/actions/invoice";

export default function ConvertToInvoiceButton({ quoteId }: { quoteId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleConvert = () => {
    if (confirm("この見積書を請求書に変換しますか？（見積書のステータスは「受注」になります）")) {
      startTransition(async () => {
        const result = await convertQuoteToInvoice(quoteId);
        if (result && !result.success) {
          alert(result.message);
        }
      });
    }
  };

  return (
    <button
      onClick={handleConvert}
      disabled={isPending}
      className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
    >
      {isPending ? "変換中..." : "⚡ 請求書に変換"}
    </button>
  );
}
