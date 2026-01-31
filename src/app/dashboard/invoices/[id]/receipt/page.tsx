import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { InvoiceTemplate } from "@/components/invoice-template";
import DocumentActionBar from "@/components/document-action-bar";

export default async function InvoiceReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id, userId },
    include: {
      client: true,
      items: true,
      user: true,
    },
  });

  if (!invoice) notFound();

  const data = {
    id: invoice.id,
    type: "領収書" as const,
    number: invoice.id,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    client: {
      name: invoice.client.name,
      address: invoice.client.address,
    },
    user: {
      companyName: invoice.user.companyName,
      invoiceRegNumber: invoice.user.invoiceRegNumber,
      email: invoice.user.email,
    },
    bankAccount: null,
    items: invoice.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    })),
  };

  return (
    <div className="flex flex-col">
      <DocumentActionBar
        backUrl={`/dashboard/invoices/${id}`}
        editUrl={`/dashboard/invoices/${id}/edit`}
        receiptUrl={null}
        deliveryUrl={`/dashboard/invoices/${id}/delivery`}
      />
      <div className="print-content">
        <InvoiceTemplate data={data} />
      </div>
    </div>
  );
}
