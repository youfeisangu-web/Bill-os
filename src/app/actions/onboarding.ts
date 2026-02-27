"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type SubmitResult = {
  success: boolean;
  message: string;
};

const DEFAULT_EMAIL = "dev@billia.local";
const DEFAULT_ACCOUNT_TYPE = "普通";

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export async function submitOnboardingData(formData: FormData): Promise<SubmitResult | undefined> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const companyName = getValue(formData, "companyName");
    const invoiceRegNumber = getValue(formData, "invoiceRegNumber");
    const bankName = getValue(formData, "bankName");
    const branchName = getValue(formData, "branchName");
    const accountNumber = getValue(formData, "accountNumber");
    const accountHolder = getValue(formData, "accountHolder");

    if (!companyName || !bankName || !branchName || !accountNumber || !accountHolder) {
      return { success: false, message: "必須項目を入力してください。" };
    }

    await prisma.userProfile.upsert({
      where: { id: userId },
      update: {
        companyName,
        invoiceRegNumber: invoiceRegNumber || null,
      },
      create: {
        id: userId,
        email: DEFAULT_EMAIL,
        companyName,
        invoiceRegNumber: invoiceRegNumber || null,
        passwordEnabled: false,
      },
    });

    const existingAccount = await prisma.bankAccount.findFirst({
      where: { userId: userId, isDefault: true },
    });

    if (existingAccount) {
      await prisma.bankAccount.update({
        where: { id: existingAccount.id },
        data: {
          bankName,
          branchName,
          accountNumber,
          accountHolder,
          accountType: DEFAULT_ACCOUNT_TYPE,
        },
      });
    } else {
      await prisma.bankAccount.create({
        data: {
          userId: userId,
          bankName,
          branchName,
          accountNumber,
          accountHolder,
          accountType: DEFAULT_ACCOUNT_TYPE,
          isDefault: true,
        },
      });
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存に失敗しました。";
    return { success: false, message };
  }
}
