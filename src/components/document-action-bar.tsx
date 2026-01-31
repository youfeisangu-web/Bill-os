"use client";

import Link from "next/link";

export default function DocumentActionBar({
  backUrl,
  editUrl,
  receiptUrl = null,
  deliveryUrl = null,
  children,
}: {
  backUrl: string;
  editUrl: string;
  /** 領収書ページのURL（請求書詳細から表示する場合に指定） */
  receiptUrl?: string | null;
  /** 納品書ページのURL（請求書詳細から表示する場合に指定） */
  deliveryUrl?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between no-print mb-6">
      <Link
        href={backUrl}
        className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1"
      >
        ← 戻る
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        {receiptUrl && (
          <Link
            href={receiptUrl}
            className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm transition hover:bg-emerald-100"
          >
            領収書を表示
          </Link>
        )}
        {deliveryUrl && (
          <Link
            href={deliveryUrl}
            className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 shadow-sm transition hover:bg-blue-100"
          >
            納品書を表示
          </Link>
        )}
        {children}
        <button
          onClick={() => window.print()}
          className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          🖨️ PDFダウンロード（印刷）
        </button>
        <Link
          href={editUrl}
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          ✏️ 編集
        </Link>
      </div>
    </div>
  );
}
