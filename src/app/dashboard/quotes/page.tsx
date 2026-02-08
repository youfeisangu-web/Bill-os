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
        <p className="billio-label">見積書</p>
        <h1 className="text-2xl font-semibold tracking-tight text-billio-text">
          見積書一覧
        </h1>
        <p className="text-sm text-billio-text-muted mt-1">
          作成済みの見積書を一覧で管理できます。チェックして一括で請求書に変換できます。
        </p>
      </header>

      <div className="billio-card overflow-hidden p-6">
        <QuotesTableWithBulkConvert quotes={quotes} />
      </div>
    </div>
  );
}
