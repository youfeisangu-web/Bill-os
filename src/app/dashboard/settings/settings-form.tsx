"use client";

import { useTransition } from "react";
import { updateSettings } from "@/app/actions/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SettingsFormProps = {
  initialData: {
    user: {
      companyName: string | null;
      representativeName: string | null;
      email: string;
      invoiceRegNumber: string | null;
      address: string | null;
    };
    bankAccount: {
      bankName: string;
      branchName: string;
      accountType: string;
      accountNumber: string;
      accountHolder: string;
    } | null;
  };
};

export default function SettingsForm({ initialData }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateSettings(formData);
      window.alert(result.message);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">設定</h1>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "保存中..." : "変更を保存"}
        </button>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="company">会社情報</TabsTrigger>
          <TabsTrigger value="bank">銀行口座</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
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
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  銀行名
                </label>
                <input
                  name="bankName"
                  defaultValue={initialData.bankAccount?.bankName || ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  支店名
                </label>
                <input
                  name="branchName"
                  defaultValue={initialData.bankAccount?.branchName || ""}
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
                  name="accountType"
                  defaultValue={initialData.bankAccount?.accountType || "普通"}
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
                  name="accountNumber"
                  defaultValue={initialData.bankAccount?.accountNumber || ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                口座名義 (カナ)
              </label>
              <input
                name="accountHolder"
                defaultValue={initialData.bankAccount?.accountHolder || ""}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}
