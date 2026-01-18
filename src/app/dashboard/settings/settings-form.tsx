"use client";

import { useTransition, useState } from "react";
import { updateSettings } from "@/app/actions/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/mode-toggle";
import ImageUpload from "@/components/image-upload";
import { Loader2 } from "lucide-react";

type SettingsFormProps = {
  userId: string;
  initialData: {
    user: {
      companyName: string | null;
      representativeName: string | null;
      email: string;
      invoiceRegNumber: string | null;
      address: string | null;
      phoneNumber: string | null;
      logoUrl: string | null;
      stampUrl: string | null;
    };
    bankAccount: {
      bankName: string;
      branchName: string;
      accountType: string;
      accountNumber: string;
      accountHolder: string;
    } | null;
    settings: {
      defaultPaymentTerms: number;
      invoiceNumberPrefix: string;
      invoiceNumberStart: number;
      taxRate: number;
      bankName: string | null;
      bankBranch: string | null;
      bankAccountType: string | null;
      bankAccountNumber: string | null;
      bankAccountHolder: string | null;
    };
  };
};

export default function SettingsForm({ userId, initialData }: SettingsFormProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData.user.logoUrl);
  const [stampUrl, setStampUrl] = useState<string | null>(initialData.user.stampUrl);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    // 画像URLをhidden inputに追加
    if (logoUrl) {
      formData.set("logoUrl", logoUrl);
    }
    if (stampUrl) {
      formData.set("stampUrl", stampUrl);
    }

    startTransition(async () => {
      const result = await updateSettings(formData);
      window.alert(result.message);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            設定
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            会社情報やシステム設定を管理できます
          </p>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "保存中..." : "変更を保存"}
        </button>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-[800px] dark:bg-[hsl(222,47%,15%)]">
          <TabsTrigger value="company" className="dark:data-[state=active]:bg-slate-700">
            基本設定
          </TabsTrigger>
          <TabsTrigger value="bank" className="dark:data-[state=active]:bg-slate-700">
            銀行・支払
          </TabsTrigger>
          <TabsTrigger value="branding" className="dark:data-[state=active]:bg-slate-700">
            ブランディング
          </TabsTrigger>
          <TabsTrigger value="system" className="dark:data-[state=active]:bg-slate-700">
            システム
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 dark:border-slate-700 dark:bg-[hsl(222,47%,15%)]">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              会社情報
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  屋号 / 会社名
                </label>
                <input
                  name="companyName"
                  defaultValue={initialData.user.companyName || ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-[hsl(222,47%,18%)] dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  代表者名
                </label>
                <input
                  name="representativeName"
                  defaultValue={initialData.user.representativeName || ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-[hsl(222,47%,18%)] dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  メールアドレス
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={initialData.user.email}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-[hsl(222,47%,18%)] dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  電話番号
                </label>
                <input
                  name="phoneNumber"
                  type="tel"
                  defaultValue={initialData.user.phoneNumber || ""}
                  placeholder="03-1234-5678"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-[hsl(222,47%,18%)] dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  インボイス登録番号 (T番号)
                </label>
                <input
                  name="invoiceRegNumber"
                  defaultValue={initialData.user.invoiceRegNumber || ""}
                  placeholder="T1234567890123"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-[hsl(222,47%,18%)] dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                住所
              </label>
              <input
                name="address"
                defaultValue={initialData.user.address || ""}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 dark:border-slate-700 dark:bg-[hsl(222,47%,15%)]">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              銀行口座・支払設定
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  銀行名
                </label>
                <input
                  name="bankName"
                  defaultValue={initialData.settings.bankName || initialData.bankAccount?.bankName || ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-[hsl(222,47%,18%)] dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  支店名
                </label>
                <input
                  name="bankBranch"
                  defaultValue={initialData.settings.bankBranch || initialData.bankAccount?.branchName || ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-[hsl(222,47%,18%)] dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  口座種別
                </label>
                <select
                  name="bankAccountType"
                  defaultValue={initialData.settings.bankAccountType || initialData.bankAccount?.accountType || "普通"}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-[hsl(222,47%,18%)] dark:text-slate-100"
                >
                  <option value="普通">普通</option>
                  <option value="当座">当座</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  口座番号
                </label>
                <input
                  name="bankAccountNumber"
                  defaultValue={initialData.settings.bankAccountNumber || initialData.bankAccount?.accountNumber || ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-[hsl(222,47%,18%)] dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                口座名義 (カナ)
              </label>
              <input
                name="bankAccountHolder"
                defaultValue={initialData.settings.bankAccountHolder || initialData.bankAccount?.accountHolder || ""}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  支払い期限（日数）
                </label>
                <input
                  name="defaultPaymentTerms"
                  type="number"
                  min={1}
                  defaultValue={initialData.settings.defaultPaymentTerms}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-[hsl(222,47%,18%)] dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  デフォルト税率（%）
                </label>
                <input
                  name="taxRate"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={initialData.settings.taxRate}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-[hsl(222,47%,18%)] dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              ブランディング
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              会社ロゴと角印をアップロードして、請求書に使用できます。
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <ImageUpload
                userId={userId}
                currentUrl={logoUrl}
                onChange={setLogoUrl}
                label="会社ロゴ"
                bucket="company-assets"
              />
              <ImageUpload
                userId={userId}
                currentUrl={stampUrl}
                onChange={setStampUrl}
                label="角印"
                bucket="company-assets"
              />
            </div>

            <input type="hidden" name="logoUrl" value={logoUrl || ""} />
            <input type="hidden" name="stampUrl" value={stampUrl || ""} />
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 dark:border-slate-700 dark:bg-[hsl(222,47%,15%)]">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              システム設定
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  請求書番号接頭辞
                </label>
                <input
                  name="invoiceNumberPrefix"
                  defaultValue={initialData.settings.invoiceNumberPrefix}
                  placeholder="INV-"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-[hsl(222,47%,18%)] dark:text-slate-100"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  例: INV-, BILL-, など
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  開始番号
                </label>
                <input
                  name="invoiceNumberStart"
                  type="number"
                  min={1}
                  defaultValue={initialData.settings.invoiceNumberStart}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-[hsl(222,47%,18%)] dark:text-slate-100"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  請求書番号の開始番号
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 block mb-2">
                外観
              </label>
              <ModeToggle />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}
