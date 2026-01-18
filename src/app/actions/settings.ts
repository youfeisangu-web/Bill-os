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
    const phoneNumber = formData.get("phoneNumber") as string;

    const bankName = formData.get("bankName") as string;
    const bankBranch = formData.get("bankBranch") as string;
    const bankAccountType = formData.get("bankAccountType") as string;
    const bankAccountNumber = formData.get("bankAccountNumber") as string;
    const bankAccountHolder = formData.get("bankAccountHolder") as string;

    const defaultPaymentTerms = formData.get("defaultPaymentTerms");
    const invoiceNumberPrefix = formData.get("invoiceNumberPrefix") as string;
    const invoiceNumberStart = formData.get("invoiceNumberStart");
    const taxRate = formData.get("taxRate");
    const logoUrl = formData.get("logoUrl") as string;
    const stampUrl = formData.get("stampUrl") as string;

    // Update UserProfile (全フィールド)
    await prisma.userProfile.update({
      where: { id: userId },
      data: {
        companyName: companyName || null,
        representativeName: representativeName || null,
        email,
        invoiceRegNumber: invoiceRegNumber || null,
        address: address || null,
        phoneNumber: phoneNumber || null,
        bankName: bankName || null,
        bankBranch: bankBranch || null,
        bankAccountType: bankAccountType || null,
        bankAccountNumber: bankAccountNumber || null,
        bankAccountHolder: bankAccountHolder || null,
        defaultPaymentTerms: defaultPaymentTerms
          ? parseInt(defaultPaymentTerms as string)
          : 30,
        invoiceNumberPrefix: invoiceNumberPrefix || "INV-",
        invoiceNumberStart: invoiceNumberStart
          ? parseInt(invoiceNumberStart as string)
          : 1,
        taxRate: taxRate ? parseInt(taxRate as string) : 10,
        logoUrl: logoUrl || null,
        stampUrl: stampUrl || null,
      },
    });

    // Update Default BankAccount (後方互換性のため保持)
    const defaultAccount = await prisma.bankAccount.findFirst({
      where: { userId: userId, isDefault: true },
    });

    if (defaultAccount) {
      await prisma.bankAccount.update({
        where: { id: defaultAccount.id },
        data: {
          bankName: bankName || "",
          branchName: bankBranch || "",
          accountType: bankAccountType || "普通",
          accountNumber: bankAccountNumber || "",
          accountHolder: bankAccountHolder || "",
        },
      });
    } else if (bankName || bankAccountNumber) {
      await prisma.bankAccount.create({
        data: {
          userId: userId,
          bankName: bankName || "",
          branchName: bankBranch || "",
          accountType: bankAccountType || "普通",
          accountNumber: bankAccountNumber || "",
          accountHolder: bankAccountHolder || "",
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

/**
 * プロフィール画像（ロゴ・角印）を即座に更新するServer Action
 */
export async function updateProfileImage(
  type: "logo" | "stamp",
  url: string | null
): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const updateData =
      type === "logo" ? { logoUrl: url } : { stampUrl: url };

    await prisma.userProfile.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/dashboard/settings");
    return { success: true, message: "画像を更新しました。" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "画像の更新に失敗しました。";
    return { success: false, message };
  }
}
