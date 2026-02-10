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
  deliveryUrl?: string | null;
  sendMailTo?: string | null;
  sendMailSubject?: string;
  sendMailBody?: string;
  sendMailLabel?: string;
  /** リマインド用（未払い請求など）。指定時は「リマインドを送る」ボタンを表示 */
  sendReminderTo?: string | null;
  sendReminderSubject?: string;
  sendReminderBody?: string;
  children?: React.ReactNode;
}) {
  const mailtoHref =
    sendMailTo
      ? buildMailto(sendMailTo, sendMailSubject, sendMailBody)
      : null;
  const reminderHref =
    sendReminderTo
      ? buildMailto(sendReminderTo, sendReminderSubject, sendReminderBody)
      : null;

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
        {mailtoHref && (
          <a
            href={mailtoHref}
            className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 shadow-sm transition hover:bg-blue-100"
          >
            📧 {sendMailLabel}
          </a>
        )}
        {reminderHref && (
          <a
            href={reminderHref}
            className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 shadow-sm transition hover:bg-amber-100"
          >
            ⏰ リマインドを送る
          </a>
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
