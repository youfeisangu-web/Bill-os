import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import QuotesTableWithBulkConvert from "./quotes-table-with-bulk-convert";

export default async function QuotesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const quotes = await prisma.quote.findMany({
    where: { userId: userId },
    orderBy: { issueDate: "desc" },
    include: {
      client: {
        select: { name: true },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            見積書
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">見積書一覧</h1>
        </div>
        <p className="text-sm text-slate-600">
          作成済みの見積書を一覧で管理できます。チェックして一括で請求書に変換できます。
        </p>
      </header>

      <QuotesTableWithBulkConvert quotes={quotes} />
    </div>
  );
}
