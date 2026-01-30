"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteClient } from "@/app/actions/client";
import { Trash2 } from "lucide-react";

export default function DeleteClientButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`「${clientName}」を削除してもよろしいですか？`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteClient(clientId);
      if (result.success) {
        router.refresh();
        window.alert(result.message);
      } else {
        window.alert(result.message);
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 className="w-3 h-3" />
      {isPending ? "削除中..." : "削除"}
    </button>
  );
}
