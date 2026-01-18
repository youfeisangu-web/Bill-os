"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="mb-12">
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-slate-900">
            Bill OS
          </h1>
          <p className="mb-2 text-xl font-medium text-slate-900">
            企業の請求業務を統合管理するクラウドERP
          </p>
          <p className="text-base text-slate-600">
            インボイス制度・電子帳簿保存法に対応。承認フローの標準化と経理DXを実現。
          </p>
        </div>

        <div className="space-y-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="inline-flex items-center rounded-full bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700">
                ログイン
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              ダッシュボードへ
            </Link>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}
