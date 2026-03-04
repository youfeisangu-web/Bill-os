import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import InvoicesTableWithBulkStatus from "./invoices-table-with-bulk-status";

export default async function InvoicesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const invoices = await prisma.invoice.findMany({
    where: { userId: userId },
    orderBy: { issueDate: "desc" },
    include: {
      client: {
        select: { name: true },
      },
    },
  });

  const invoicesForClient = invoices.map((inv) => ({
    id: inv.id,
    issueDate: inv.issueDate.toISOString(),
    totalAmount: inv.totalAmount,
    status: inv.status,
    client: inv.client,
  }));

  return (
    <div className="flex flex-col gap-5 py-5 md:gap-8 md:py-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="billia-label">請求書</p>
          <h1 className="text-xl font-semibold tracking-tight text-billia-text md:text-2xl">
            請求書一覧
          </h1>
          <p className="text-xs text-billia-text-muted mt-1 hidden md:block">
            登録済みの請求書を一覧で管理できます。
          </p>
        </div>
        <a
          href="/api/export/invoices"
          className="shrink-0 text-xs text-slate-400 hover:text-slate-600 transition"
        >
          CSV出力
        </a>
      </header>

      <div className="billia-card overflow-hidden p-4 md:p-6">
        <InvoicesTableWithBulkStatus invoices={invoicesForClient} />
      </div>
    </div>
  );
}
