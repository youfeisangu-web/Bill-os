"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type SubmitResult = {
  success: boolean;
  message: string;
};

export async function updateSettings(formData: FormData): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const companyName = formData.get("companyName") as string;
    const representativeName = formData.get("representativeName") as string;
    const email = formData.get("email") as string;
    const invoiceRegNumber = formData.get("invoiceRegNumber") as string;
    const address = formData.get("address") as string;

    const bankName = formData.get("bankName") as string;
    const branchName = formData.get("branchName") as string;
    const accountType = formData.get("accountType") as string;
    const accountNumber = formData.get("accountNumber") as string;
    const accountHolder = formData.get("accountHolder") as string;

    // Update UserProfile
    await prisma.userProfile.update({
      where: { id: userId },
      data: {
        companyName,
        representativeName,
        email,
        invoiceRegNumber,
        address,
      },
    });

    // Update Default BankAccount
    const defaultAccount = await prisma.bankAccount.findFirst({
      where: { userId: userId, isDefault: true },
    });

    if (defaultAccount) {
      await prisma.bankAccount.update({
        where: { id: defaultAccount.id },
        data: {
          bankName,
          branchName,
          accountType,
          accountNumber,
          accountHolder,
        },
      });
    } else {
      await prisma.bankAccount.create({
        data: {
          userId: userId,
          bankName,
          branchName,
          accountType,
          accountNumber,
          accountHolder,
          isDefault: true,
        },
      });
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true, message: "設定を更新しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "更新に失敗しました。";
    return { success: false, message };
  }
}
