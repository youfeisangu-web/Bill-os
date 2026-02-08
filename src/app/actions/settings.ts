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

    // 現在のユーザーデータを取得（emailが必須のため）
    const currentUser = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    // フォームデータを取得し、null/undefinedを空文字またはデフォルト値に変換
    const companyName = (formData.get("companyName") as string)?.trim() || "";
    const representativeName = (formData.get("representativeName") as string)?.trim() || "";
    const email = (formData.get("email") as string)?.trim() || currentUser?.email || "";
    const invoiceRegNumber = (formData.get("invoiceRegNumber") as string)?.trim() || "";
    const address = (formData.get("address") as string)?.trim() || "";
    const phoneNumber = (formData.get("phoneNumber") as string)?.trim() || "";

    const bankName = (formData.get("bankName") as string)?.trim() || "";
    const bankBranch = (formData.get("bankBranch") as string)?.trim() || "";
    const bankAccountType = (formData.get("bankAccountType") as string)?.trim() || "普通";
    const bankAccountNumber = (formData.get("bankAccountNumber") as string)?.trim() || "";
    const bankAccountHolder = (formData.get("bankAccountHolder") as string)?.trim() || "";

    const defaultPaymentTerm = (formData.get("defaultPaymentTerm") as string)?.trim() || "end_of_next_month";
    const defaultPaymentTermsRaw = formData.get("defaultPaymentTerms");
    const invoiceNumberPrefix = (formData.get("invoiceNumberPrefix") as string)?.trim() || "INV-";
    const invoiceNumberStartRaw = formData.get("invoiceNumberStart");
    const taxRateRaw = formData.get("taxRate");
    const taxRounding = (formData.get("taxRounding") as string)?.trim() || "floor";
    const invoiceDesign = (formData.get("invoiceDesign") as string)?.trim() || "classic";
    const logoUrl = (formData.get("logoUrl") as string)?.trim() || "";
    const stampUrl = (formData.get("stampUrl") as string)?.trim() || "";

    // 数値フィールドのサニタイズ（発行日からN日後のときの日数）
    const defaultPaymentTerms = defaultPaymentTermsRaw
      ? parseInt(String(defaultPaymentTermsRaw))
      : defaultPaymentTerm === "days_after_issue" ? 14 : 30;
    const invoiceNumberStart = invoiceNumberStartRaw
      ? parseInt(String(invoiceNumberStartRaw))
      : 1;
    const taxRate = taxRateRaw ? parseInt(String(taxRateRaw)) : 10;

    // Update UserProfile (全フィールド) - null/undefinedを空文字に統一してPrismaエラーを防止
    await prisma.userProfile.update({
      where: { id: userId },
      data: {
        // 全てのString?フィールドを空文字に統一（nullではなく""にすることでエラー回避）
        companyName: companyName ?? "",
        representativeName: representativeName ?? "",
        email: email || "dev@bill-os.local", // emailは必須のためフォールバック必須
        invoiceRegNumber: invoiceRegNumber ?? "",
        address: address ?? "",
        phoneNumber: phoneNumber ?? "",
        bankName: bankName ?? "",
        bankBranch: bankBranch ?? "",
        bankAccountType: bankAccountType ?? "",
        bankAccountNumber: bankAccountNumber ?? "",
        bankAccountHolder: bankAccountHolder ?? "",
        defaultPaymentTerm: defaultPaymentTerm ?? "end_of_next_month",
        defaultPaymentTerms,
        invoiceNumberPrefix: invoiceNumberPrefix ?? "INV-",
        invoiceNumberStart,
        taxRate,
        taxRounding: taxRounding ?? "floor",
        invoiceDesign: invoiceDesign ?? "classic",
        logoUrl: logoUrl ?? "",
        stampUrl: stampUrl ?? "",
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
