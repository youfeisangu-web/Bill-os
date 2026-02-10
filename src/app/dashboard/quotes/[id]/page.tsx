import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { InvoiceTemplate } from "@/components/invoice-template";
import DocumentActionBar from "@/components/document-action-bar";
import ConvertToInvoiceButton from "./convert-button";
import AcceptLinkButton from "./accept-link-button";

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

  const clientEmail = quote.client.email ?? "";
  const quoteMailSubject = `見積書 ${quote.quoteNumber}`;
  const quoteMailBody = [
    "お世話になっております。",
    "",
    "下記の見積書をご確認ください。",
    "このメールにPDFを添付のうえ、お送りください。",
    "",
    `見積番号: ${quote.quoteNumber}`,
    `有効期限: ${quote.validUntil.toISOString().slice(0, 10)}`,
    `合計金額: ¥${quote.totalAmount.toLocaleString()}`,
    "",
    "よろしくお願いいたします。",
  ].join("\n");

  return (
    <div className="flex flex-col">
      <DocumentActionBar
        backUrl="/dashboard/quotes"
        editUrl={`/dashboard/quotes/${quote.id}/edit`}
        sendMailTo={clientEmail || undefined}
        sendMailSubject={quoteMailSubject}
        sendMailBody={quoteMailBody}
        sendMailLabel="メールで送付"
      >
        {quote.status !== "受注" && (
          <>
            <AcceptLinkButton quoteId={quote.id} />
            <ConvertToInvoiceButton quoteId={quote.id} />
          </>
        )}
      </DocumentActionBar>
      <div className="print-content">
        <InvoiceTemplate data={data} />
      </div>
    </div>
  );
}
