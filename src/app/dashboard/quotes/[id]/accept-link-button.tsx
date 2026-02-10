"use client";

import { useState, useTransition } from "react";
import { ensureAcceptToken } from "@/app/actions/quote";

export default function AcceptLinkButton({ quoteId }: { quoteId: string }) {
  const [isPending, startTransition] = useTransition();
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleIssue = () => {
    setError(null);
    setAcceptUrl(null);
    startTransition(async () => {
      const result = await ensureAcceptToken(quoteId);
      if (result.success) {
        setAcceptUrl(result.acceptUrl);
      } else {
        setError(result.message);
      }
    });
  };

  const handleCopy = () => {
    if (!acceptUrl) return;
    void navigator.clipboard.writeText(acceptUrl).then(() => {
      alert("リンクをコピーしました。");
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleIssue}
        disabled={isPending}
        className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-800 shadow-sm transition hover:bg-violet-100 disabled:opacity-60"
      >
        {isPending ? "発行中…" : "承諾リンクを発行"}
      </button>
      {error && (
        <p className="text-sm text-rose-600">{error}</p>
      )}
      {acceptUrl && (
        <div className="flex items-center gap-2 text-sm">
          <input
            type="text"
            readOnly
            value={acceptUrl}
            className="w-72 rounded border border-black/10 bg-slate-50 px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="rounded border border-black/20 px-2 py-1 text-xs hover:bg-black/5"
          >
            コピー
          </button>
        </div>
      )}
    </div>
  );
}
