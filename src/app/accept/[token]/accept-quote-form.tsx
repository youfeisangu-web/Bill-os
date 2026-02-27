"use client";

import { useTransition, useState } from "react";
import { acceptQuoteByToken } from "@/app/actions/quote";

export default function AcceptQuoteForm({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptQuoteByToken(token);
      if (result.success) {
        setMessage({ type: "ok", text: "承諾しました。ありがとうございます。" });
      } else {
        setMessage({ type: "error", text: result.message });
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleAccept}
        disabled={isPending}
        className="w-full rounded-xl bg-billia-blue text-white font-medium py-3 px-4 hover:opacity-90 disabled:opacity-60 transition"
      >
        {isPending ? "処理中…" : "承諾する"}
      </button>
      {message && (
        <p
          className={
            message.type === "ok"
              ? "text-center text-emerald-600 text-sm"
              : "text-center text-rose-600 text-sm"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
