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
        email: "dev@bill-os.local",
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
    },
    bankAccount: user.bankAccounts[0] || null,
  };

  return <SettingsForm initialData={initialData} />;
}
