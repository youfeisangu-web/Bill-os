"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateClient } from "@/app/actions/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";

type Client = {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
};

export default function EditClientDialog({ client }: { client: Client }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("id", client.id);
    startTransition(async () => {
      const result = await updateClient(formData);
      if (result.success) {
        setOpen(false);
        router.refresh();
        window.alert(result.message);
      } else {
        window.alert(result.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
          <Pencil className="w-3 h-3" />
          編集
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>取引先情報を編集</DialogTitle>
          <DialogDescription>
            取引先の情報を更新します。
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
              取引先名 (必須)
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={client.name}
              placeholder="株式会社サンプル"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
              メールアドレス
            </label>
            <input
              name="email"
              type="email"
              defaultValue={client.email || ""}
              placeholder="billing@example.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
              住所
            </label>
            <input
              name="address"
              type="text"
              defaultValue={client.address || ""}
              placeholder="東京都渋谷区..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <DialogFooter>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isPending ? "更新中..." : "更新する"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
