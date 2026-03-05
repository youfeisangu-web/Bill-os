import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import QuotesTableWithBulkConvert from "./quotes-table-with-bulk-convert";

export default async function QuotesPage() {
  const { userId, orgId } = await auth();
  if (!userId) {
    redirect("/");
  }
  const scope = orgId ? { orgId } : { userId };

  const quotes = await prisma.quote.findMany({
    where: { ...scope },
    orderBy: { issueDate: "desc" },
    include: {
      client: {
        select: { name: true },
      },
    },
  });

  return (
    <div className="flex flex-col gap-5 py-5 md:gap-8 md:py-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="billia-label">見積書</p>
          <h1 className="text-xl font-semibold tracking-tight text-billia-text md:text-2xl">
            見積書一覧
          </h1>
          <p className="text-xs text-billia-text-muted mt-1 hidden md:block">
            作成済みの見積書を一覧で管理できます。チェックして一括で請求書に変換できます。
          </p>
        </div>
        <a
          href="/api/export/quotes"
          className="shrink-0 text-xs text-slate-400 hover:text-slate-600 transition"
        >
          CSV出力
        </a>
      </header>

      <div className="billia-card overflow-hidden p-4 md:p-6">
        <QuotesTableWithBulkConvert quotes={quotes} />
      </div>
    </div>
  );
}
