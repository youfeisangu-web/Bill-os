"use client";

import Link from "next/link";

export default function DocumentActionBar({ 
  backUrl, 
  editUrl,
  children
}: { 
  backUrl: string; 
  editUrl: string;
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
      <div className="flex items-center gap-3">
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
