import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { InvoiceTemplate } from "@/components/invoice-template";
import DocumentActionBar from "@/components/document-action-bar";
import DocumentScaleWrapper from "@/components/document-scale-wrapper";
import ApprovalActions from "@/components/approval-actions";

export default async function InvoiceDetailPage({
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

  const invoice = await prisma.invoice.findFirst({
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

  const clientEmail = invoice.client.email ?? "";
  const mailSubject = `請求書 ${invoice.id}`;
  const mailBody = [
    "お世話になっております。",
    "",
    "下記の請求書をご確認ください。",
    "このメールにPDFを添付のうえ、お送りください。",
    "",
    `請求書番号: ${invoice.id}`,
    `お支払い期限: ${invoice.dueDate.toISOString().slice(0, 10)}`,
    `合計金額: ¥${invoice.totalAmount.toLocaleString()}`,
    "",
    "よろしくお願いいたします。",
  ].join("\n");

  const isUnpaid = ["未払い", "部分払い"].includes(invoice.status);
  const reminderSubject = `【お支払いのご案内】請求書 ${invoice.id}`;
  const reminderBody = [
    "お世話になっております。",
    "",
    "下記の請求書のお支払いがまだお済みでないようです。",
    "ご確認のうえ、お支払いいただけますと幸いです。",
    "",
    `請求書番号: ${invoice.id}`,
    `取引先: ${invoice.client.name}`,
    `お支払い期限: ${invoice.dueDate.toISOString().slice(0, 10)}`,
    `合計: ¥${invoice.totalAmount.toLocaleString()}`,
    "",
    "よろしくお願いいたします。",
  ].join("\n");

  return (
    <div className="flex flex-col">
      {orgId && (
        <div className="no-print mb-4">
          <ApprovalActions
            type="invoice"
            id={invoice.id}
            approvalStatus={invoice.approvalStatus ?? "DRAFT"}
            approvedAt={invoice.approvedAt ?? null}
            rejectionNote={invoice.rejectionNote ?? null}
            userRole={userRole}
          />
        </div>
      )}
      <DocumentActionBar
        backUrl="/dashboard/invoices"
        editUrl={`/dashboard/invoices/${invoice.id}/edit`}
        receiptUrl={`/dashboard/invoices/${invoice.id}/receipt`}
        receiptIssued={!!invoice.receiptIssuedAt}
        deliveryUrl={`/dashboard/invoices/${invoice.id}/delivery`}
        sendMailTo={clientEmail || undefined}
        sendMailSubject={mailSubject}
        sendMailBody={mailBody}
        sendMailLabel="メールで送付"
        sendReminderTo={isUnpaid && clientEmail ? clientEmail : undefined}
        sendReminderSubject={reminderSubject}
        sendReminderBody={reminderBody}
      />
      <DocumentScaleWrapper>
        <InvoiceTemplate data={data} />
      </DocumentScaleWrapper>
    </div>
  );
}
