import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { InvoiceTemplate } from "@/components/invoice-template";
import DocumentActionBar from "@/components/document-action-bar";
import DocumentScaleWrapper from "@/components/document-scale-wrapper";
import ConvertToInvoiceButton from "./convert-button";
import AcceptLinkButton from "./accept-link-button";
import ApprovalActions from "@/components/approval-actions";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId, orgId } = await auth();
  if (!userId) {
    redirect("/");
  }
  const scope = orgId ? { orgId } : { userId };

  const userProfile = orgId
    ? await prisma.userProfile.findUnique({ where: { id: userId }, select: { role: true } })
    : null;
  const userRole = userProfile?.role ?? "USER";

  const { id } = await params;

  const quote = await prisma.quote.findFirst({
    where: { id, ...scope },
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
      {orgId && (
        <div className="no-print mb-4">
          <ApprovalActions
            type="quote"
            id={quote.id}
            approvalStatus={quote.approvalStatus ?? "DRAFT"}
            approvedAt={quote.approvedAt ?? null}
            rejectionNote={quote.rejectionNote ?? null}
            userRole={userRole}
          />
        </div>
      )}
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
      <DocumentScaleWrapper>
        <InvoiceTemplate data={data} />
      </DocumentScaleWrapper>
    </div>
  );
}
