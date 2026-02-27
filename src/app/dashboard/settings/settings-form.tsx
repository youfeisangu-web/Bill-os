"use client";

import { useTransition, useState } from "react";
import { updateSettings } from "@/app/actions/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      defaultPaymentTerm: string;
      defaultPaymentTerms: number;
      invoiceNumberPrefix: string;
      invoiceNumberStart: number;
      taxRate: number;
      taxRounding: string;
      invoiceDesign: string;
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
  const [selectedDesign, setSelectedDesign] = useState<string>(initialData.settings.invoiceDesign);
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
    
    // 選択されたデザインを確実に設定
    formData.set("invoiceDesign", selectedDesign);

    startTransition(async () => {
      const result = await updateSettings(formData);
      window.alert(result.message);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            設定
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            会社情報やシステム設定を管理できます
          </p>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-billia-blue px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "保存中..." : "変更を保存"}
        </button>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-[800px]">
          <TabsTrigger value="company">
            基本設定
          </TabsTrigger>
          <TabsTrigger value="bank">
            銀行・支払
          </TabsTrigger>
          <TabsTrigger value="branding">
            ブランディング
          </TabsTrigger>
          <TabsTrigger value="system">
            システム
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6">
          <div className="rounded-2xl p-6 space-y-4 bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
            <h2 className="text-lg font-semibold text-billia-text">
              会社情報
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  屋号 / 会社名
                </label>
                <input
                  name="companyName"
                  defaultValue={initialData.user.companyName || ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  代表者名
                </label>
                <input
                  name="representativeName"
                  defaultValue={initialData.user.representativeName || ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  メールアドレス
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={initialData.user.email}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  電話番号
                </label>
                <input
                  name="phoneNumber"
                  type="tel"
                  defaultValue={initialData.user.phoneNumber || ""}
                  placeholder="03-1234-5678"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  インボイス登録番号 (T番号)
                </label>
                <input
                  name="invoiceRegNumber"
                  defaultValue={initialData.user.invoiceRegNumber || ""}
                  placeholder="T1234567890123"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                住所
              </label>
              <input
                name="address"
                defaultValue={initialData.user.address || ""}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <div className="rounded-2xl p-6 space-y-4 bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
            <h2 className="text-lg font-semibold text-billia-text">
              銀行口座・支払設定
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  銀行名
                </label>
                <input
                  name="bankName"
                  defaultValue={initialData.settings.bankName || initialData.bankAccount?.bankName || ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  支店名
                </label>
                <input
                  name="bankBranch"
                  defaultValue={initialData.settings.bankBranch || initialData.bankAccount?.branchName || ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  口座種別
                </label>
                <select
                  name="bankAccountType"
                  defaultValue={initialData.settings.bankAccountType || initialData.bankAccount?.accountType || "普通"}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="普通">普通</option>
                  <option value="当座">当座</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  口座番号
                </label>
                <input
                  name="bankAccountNumber"
                  defaultValue={initialData.settings.bankAccountNumber || initialData.bankAccount?.accountNumber || ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                口座名義 (カナ)
              </label>
              <input
                name="bankAccountHolder"
                defaultValue={initialData.settings.bankAccountHolder || initialData.bankAccount?.accountHolder || ""}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-slate-200">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  支払期限のデフォルト
                </label>
                <p className="text-sm text-slate-600">
                  請求書作成画面を開いたときの、発行日・支払期限の初期値です。
                </p>
                <select
                  name="defaultPaymentTerm"
                  defaultValue={initialData.settings.defaultPaymentTerm}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="end_of_next_month">当月末締め・翌月末払い</option>
                  <option value="10th_of_next_month">当月末締め・翌月10日払い</option>
                  <option value="20th_of_next_month">当月末締め・翌月20日払い</option>
                  <option value="days_after_issue">発行日から14日後</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  デフォルト税率（%）
                </label>
                <input
                  name="taxRate"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={initialData.settings.taxRate}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  消費税の端数処理
                </label>
                <select
                  name="taxRounding"
                  defaultValue={initialData.settings.taxRounding}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="floor">切り捨て（標準）</option>
                  <option value="round">四捨五入</option>
                  <option value="ceil">切り上げ</option>
                </select>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <div className="rounded-2xl p-6 space-y-6 bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
            <h2 className="text-lg font-semibold text-billia-text">
              ブランディング
            </h2>
            <p className="text-sm text-billia-text-muted">
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
          <div className="rounded-2xl p-6 space-y-6 bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
            <h2 className="text-lg font-semibold text-billia-text">
              システム設定
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  請求書番号接頭辞
                </label>
                <input
                  name="invoiceNumberPrefix"
                  defaultValue={initialData.settings.invoiceNumberPrefix}
                  placeholder="INV-"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <p className="text-xs text-slate-500">
                  例: INV-, BILL-, など
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  開始番号
                </label>
                <input
                  name="invoiceNumberStart"
                  type="number"
                  min={1}
                  defaultValue={initialData.settings.invoiceNumberStart}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <p className="text-xs text-slate-500">
                  請求書番号の開始番号
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-4 block">
                請求書デザイン
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { value: "classic", label: "クラシック", description: "伝統的なレイアウト" },
                  { value: "modern", label: "モダン", description: "シンプルで洗練されたデザイン" },
                  { value: "minimal", label: "ミニマル", description: "シンプルで読みやすい" },
                  { value: "elegant", label: "エレガント", description: "上品で落ち着いたデザイン" },
                  { value: "professional", label: "プロフェッショナル", description: "ビジネス向けの堅実なデザイン" },
                ].map((design) => (
                  <label
                    key={design.value}
                    className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedDesign === design.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                    onClick={() => setSelectedDesign(design.value)}
                  >
                    <input
                      type="radio"
                      name="invoiceDesign"
                      value={design.value}
                      checked={selectedDesign === design.value}
                      onChange={() => setSelectedDesign(design.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedDesign === design.value
                          ? "border-blue-500"
                          : "border-slate-300"
                      }`}>
                        {selectedDesign === design.value && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span className="font-semibold text-slate-900">{design.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 ml-6">{design.description}</p>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}
