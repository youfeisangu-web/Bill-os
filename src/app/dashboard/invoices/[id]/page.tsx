import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { InvoiceTemplate } from "@/components/invoice-template";
import DocumentActionBar from "@/components/document-action-bar";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id, userId: userId },
    include: {
      client: true,
      items: true,
      user: {
        include: {
          bankAccounts: {
            where: { isDefault: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  const bankAccount = invoice.user.bankAccounts[0] || null;

  const data = {
    id: invoice.id,
    type: "請求書" as const,
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
    bankAccount: bankAccount
      ? {
          bankName: bankAccount.bankName,
          branchName: bankAccount.branchName,
          accountType: bankAccount.accountType,
          accountNumber: bankAccount.accountNumber,
          accountHolder: bankAccount.accountHolder,
        }
      : null,
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
        backUrl="/dashboard/invoices"
        editUrl={`/dashboard/invoices/${invoice.id}/edit`}
        receiptUrl={`/dashboard/invoices/${invoice.id}/receipt`}
        deliveryUrl={`/dashboard/invoices/${invoice.id}/delivery`}
      />
      <div className="print-content">
        <InvoiceTemplate data={data} design={invoice.user.invoiceDesign || "classic"} />
      </div>
    </div>
  );
}
