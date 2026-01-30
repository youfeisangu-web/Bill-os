"use client";

import { useTransition } from "react";
import { deleteTenant } from "@/app/actions/tenant";
import { Trash2 } from "lucide-react";

type Props = {
  tenantId: string;
  tenantName: string;
};

export default function DeleteTenantButton({ tenantId, tenantName }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`取引先「${tenantName}」を削除しますか？`)) {
      return;
    }

    startTransition(async () => {
      await deleteTenant(tenantId);
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Trash2 className="w-3 h-3" />
      {isPending ? "削除中..." : "削除"}
    </button>
  );
}
