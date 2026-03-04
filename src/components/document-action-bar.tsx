"use client";

import Link from "next/link";

function buildMailto(to: string, subject: string, body: string): string {
  const u = new URL("mailto:" + encodeURIComponent(to));
  u.searchParams.set("subject", subject);
  u.searchParams.set("body", body);
  return u.toString();
}

export default function DocumentActionBar({
  backUrl,
  editUrl,
  receiptUrl = null,
  receiptIssued = false,
  deliveryUrl = null,
  sendMailTo = null,
  sendMailSubject = "",
  sendMailBody = "",
  sendMailLabel = "メールで送付",
  sendReminderTo = null,
  sendReminderSubject = "",
  sendReminderBody = "",
  children,
}: {
  backUrl: string;
  editUrl: string;
  receiptUrl?: string | null;
  receiptIssued?: boolean;
  deliveryUrl?: string | null;
  sendMailTo?: string | null;
  sendMailSubject?: string;
  sendMailBody?: string;
  sendMailLabel?: string;
  sendReminderTo?: string | null;
  sendReminderSubject?: string;
  sendReminderBody?: string;
  children?: React.ReactNode;
}) {
  const mailtoHref = sendMailTo
    ? buildMailto(sendMailTo, sendMailSubject, sendMailBody)
    : null;
  const reminderHref = sendReminderTo
    ? buildMailto(sendReminderTo, sendReminderSubject, sendReminderBody)
    : null;

  return (
    <div className="no-print mb-6 space-y-3">
      {/* 上段：戻る ＋ 編集 */}
      <div className="flex items-center justify-between">
        <Link
          href={backUrl}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          ← 戻る
        </Link>
        <Link
          href={editUrl}
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          ✏️ 編集
        </Link>
      </div>

      {/* 下段：PDF（目立つ） */}
      <button
        onClick={() => window.print()}
        className="w-full inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        🖨️ PDFダウンロード
      </button>

      {/* サブアクション */}
      {(receiptUrl || deliveryUrl || mailtoHref || reminderHref || children) && (
        <div className="flex flex-wrap items-center gap-2">
          {receiptUrl && (
            <div className="flex items-center gap-1.5">
              <Link
                href={receiptUrl}
                className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 shadow-sm transition hover:bg-emerald-100"
              >
                領収書
              </Link>
              {receiptIssued && (
                <span className="text-xs text-emerald-600 font-medium">発行済み</span>
              )}
            </div>
          )}
          {deliveryUrl && (
            <Link
              href={deliveryUrl}
              className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800 shadow-sm transition hover:bg-blue-100"
            >
              納品書
            </Link>
          )}
          {mailtoHref && (
            <a
              href={mailtoHref}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              📧 {sendMailLabel}
            </a>
          )}
          {reminderHref && (
            <a
              href={reminderHref}
              className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 shadow-sm transition hover:bg-amber-100"
            >
              ⏰ リマインド
            </a>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
