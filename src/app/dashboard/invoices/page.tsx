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
    <div className="flex flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <p className="billio-label">請求書</p>
        <h1 className="text-2xl font-semibold tracking-tight text-billio-text">
          請求書一覧
        </h1>
        <p className="text-sm text-billio-text-muted mt-1">
          登録済みの請求書を一覧で管理できます。
        </p>
      </header>

      <div className="billio-card overflow-hidden p-6">
        <InvoicesTableWithBulkStatus invoices={invoicesForClient} />
      </div>
    </div>
  );
}
