"use client";

import { useTransition } from "react";
import { submitOnboardingData } from "@/app/actions/onboarding";

export default function OnboardingPage() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("onboardingSaved", "1");
    }
    startTransition(async () => {
      const result = await submitOnboardingData(formData);
      if (result && !result.success) {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem("onboardingSaved");
          window.alert(result.message);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center">
        <div className="w-full rounded-3xl bg-white p-10 shadow-md sm:p-12">
          <div className="mb-10 space-y-3 text-center">
            <h1 className="text-3xl font-semibold text-slate-900">
              Bill OSへようこそ
            </h1>
            <p className="text-sm text-slate-600">
              まずは、あなたのビジネス情報を設定しましょう。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                屋号 / 会社名
              </label>
              <input
                name="companyName"
                type="text"
                placeholder="株式会社Bill OS"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                適格請求書発行事業者番号 (T番号)
              </label>
              <input
                name="invoiceRegNumber"
                type="text"
                placeholder="T1234567890123"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                メイン銀行口座
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="bankName"
                  type="text"
                  placeholder="銀行名"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  name="branchName"
                  type="text"
                  placeholder="支店名"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  name="accountNumber"
                  type="text"
                  placeholder="口座番号"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  name="accountHolder"
                  type="text"
                  placeholder="名義"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-4 w-full rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isPending ? "保存中..." : "設定を保存して始める"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
