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
    <div className="flex flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="billia-label">見積書</p>
            <h1 className="text-2xl font-semibold tracking-tight text-billia-text">
              見積書一覧
            </h1>
            <p className="text-sm text-billia-text-muted mt-1">
              作成済みの見積書を一覧で管理できます。チェックして一括で請求書に変換できます。
            </p>
          </div>
          <a
            href="/api/export/quotes"
            className="shrink-0 inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-billia-text shadow-sm transition hover:bg-black/[0.04]"
          >
            CSVエクスポート
          </a>
        </div>
      </header>

      <div className="billia-card overflow-hidden p-6">
        <QuotesTableWithBulkConvert quotes={quotes} />
      </div>
    </div>
  );
}
