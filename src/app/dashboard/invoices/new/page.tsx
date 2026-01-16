import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import InvoiceEditor from "./invoice-editor";

export default async function NewInvoicePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const clients = await prisma.client.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/invoices"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← 請求書一覧へ戻る
        </Link>
      </div>
      <InvoiceEditor clients={clients} />
    </div>
  );
}
