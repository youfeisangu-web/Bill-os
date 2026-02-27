import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  let user = await prisma.userProfile.findUnique({
    where: { id: userId },
    include: {
      bankAccounts: {
        where: { isDefault: true },
        take: 1,
      },
    },
  });

  if (!user) {
    user = await prisma.userProfile.create({
      data: {
        id: userId,
        email: "dev@billia.local",
        companyName: "",
        representativeName: "",
        address: "",
        invoiceRegNumber: "",
      },
      include: {
        bankAccounts: {
          where: { isDefault: true },
          take: 1,
        },
      },
    });
  }

  const initialData = {
    user: {
      companyName: user.companyName,
      representativeName: user.representativeName,
      email: user.email,
      invoiceRegNumber: user.invoiceRegNumber,
      address: user.address,
      phoneNumber: user.phoneNumber,
      logoUrl: user.logoUrl,
      stampUrl: user.stampUrl,
    },
    bankAccount: user.bankAccounts[0] || null,
    settings: {
      defaultPaymentTerm: user.defaultPaymentTerm ?? "end_of_next_month",
      defaultPaymentTerms: user.defaultPaymentTerms ?? 30,
      invoiceNumberPrefix: user.invoiceNumberPrefix ?? "INV-",
      invoiceNumberStart: user.invoiceNumberStart ?? 1,
      taxRate: user.taxRate ?? 10,
      taxRounding: user.taxRounding ?? "floor",
      invoiceDesign: user.invoiceDesign ?? "classic",
      bankName: user.bankName,
      bankBranch: user.bankBranch,
      bankAccountType: user.bankAccountType,
      bankAccountNumber: user.bankAccountNumber,
      bankAccountHolder: user.bankAccountHolder,
    },
  };

  return (
    <div className="p-8">
      <SettingsForm userId={userId} initialData={initialData} />
    </div>
  );
}
