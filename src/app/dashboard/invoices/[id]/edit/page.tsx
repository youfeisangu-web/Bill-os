import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import InvoiceEditForm from "./invoice-edit-form";

export default async function InvoiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id, userId },
    include: { client: true },
  });

  if (!invoice) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/invoices/${id}`}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← 請求書に戻る
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">請求書を編集</h1>
        <p className="mt-1 text-sm text-slate-500">
          {invoice.id}　{invoice.client.name}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          金額: ¥{invoice.totalAmount.toLocaleString()}
        </p>

        <InvoiceEditForm invoiceId={id} currentStatus={invoice.status} />
      </section>
    </div>
  );
}
