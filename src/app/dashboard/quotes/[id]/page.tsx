import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { InvoiceTemplate } from "@/components/invoice-template";
import DocumentActionBar from "@/components/document-action-bar";
import ConvertToInvoiceButton from "./convert-button";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const { id } = await params;

  const quote = await prisma.quote.findUnique({
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

  if (!quote) {
    notFound();
  }

  const bankAccount = quote.user.bankAccounts[0] || null;

  const data = {
    id: quote.id,
    type: "見積書" as const,
    number: quote.quoteNumber,
    issueDate: quote.issueDate,
    validUntil: quote.validUntil,
    subtotal: quote.subtotal,
    taxAmount: quote.taxAmount,
    totalAmount: quote.totalAmount,
    client: {
      name: quote.client.name,
      address: quote.client.address,
    },
    user: {
      companyName: quote.user.companyName,
      invoiceRegNumber: quote.user.invoiceRegNumber,
      email: quote.user.email,
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
    items: quote.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    })),
  };

  return (
    <div className="flex flex-col">
      <DocumentActionBar 
        backUrl="/dashboard/quotes" 
        editUrl={`/dashboard/quotes/${quote.id}/edit`} 
      >
        {quote.status !== "受注" && (
          <ConvertToInvoiceButton quoteId={quote.id} />
        )}
      </DocumentActionBar>
      <div className="print-content">
        <InvoiceTemplate data={data} />
      </div>
    </div>
  );
}
