"use client";

import { useState, useTransition } from "react";
import { requestApproval, approveDocument, rejectDocument } from "@/app/actions/approval";
import { CheckCircle2, XCircle, Clock, FileCheck } from "lucide-react";

type Props = {
  type: "invoice" | "quote";
  id: string;
  approvalStatus: string | null;
  approvedAt: Date | null;
  rejectionNote: string | null;
  userRole: string;
};

const statusConfig = {
  DRAFT:    { label: "下書き",    className: "bg-slate-100 text-slate-600",   icon: null },
  PENDING:  { label: "承認待ち",  className: "bg-amber-100 text-amber-700",   icon: Clock },
  APPROVED: { label: "承認済み",  className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  REJECTED: { label: "却下",      className: "bg-red-100 text-red-700",       icon: XCircle },
} as const;

export default function ApprovalActions({
  type,
  id,
  approvalStatus,
  approvedAt,
  rejectionNote,
  userRole,
}: Props) {
  const status = (approvalStatus ?? "DRAFT") as keyof typeof statusConfig;
  const config = statusConfig[status] ?? statusConfig.DRAFT;
  const StatusIcon = config.icon;

  const [rejectNote, setRejectNote] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isAdmin = userRole === "ADMIN";

  const handle = (fn: () => Promise<{ success: boolean; message: string }>) => {
    startTransition(async () => {
      const res = await fn();
      if (!res.success) alert(res.message);
    });
  };

  return (
    <div className="no-print rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-slate-500 shrink-0" />
          <span className="text-sm font-medium text-slate-700">承認ステータス</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
          {StatusIcon && <StatusIcon className="h-3.5 w-3.5" />}
          {config.label}
        </span>
      </div>

      {status === "APPROVED" && approvedAt && (
        <p className="text-xs text-slate-500">
          {new Date(approvedAt).toLocaleString("ja-JP")} に承認
        </p>
      )}

      {status === "REJECTED" && rejectionNote && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          <span className="font-medium">却下理由：</span>{rejectionNote}
        </div>
      )}

      {/* 申請ボタン（非ADMIN・DRAFT or REJECTED時） */}
      {!isAdmin && (status === "DRAFT" || status === "REJECTED") && (
        <button
          type="button"
          onClick={() => handle(() => requestApproval(type, id))}
          disabled={isPending}
          className="w-full rounded-xl border border-amber-200 bg-amber-50 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
        >
          承認申請する
        </button>
      )}

      {/* ADMIN用：承認・却下ボタン（PENDING時） */}
      {isAdmin && status === "PENDING" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handle(() => approveDocument(type, id))}
              disabled={isPending}
              className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              承認する
            </button>
            <button
              type="button"
              onClick={() => setShowRejectInput((v) => !v)}
              disabled={isPending}
              className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              却下する
            </button>
          </div>
          {showRejectInput && (
            <div className="space-y-2">
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="却下理由（任意）"
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={() => {
                  handle(() => rejectDocument(type, id, rejectNote));
                  setShowRejectInput(false);
                  setRejectNote("");
                }}
                disabled={isPending}
                className="w-full rounded-xl bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                却下を確定する
              </button>
            </div>
          )}
        </div>
      )}

      {/* ADMIN用：差し戻し後の再申請待ち表示 */}
      {isAdmin && status === "DRAFT" && (
        <p className="text-xs text-slate-400 text-center">申請待ちです</p>
      )}
    </div>
  );
}
