"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { ShieldCheck, BarChart3, Receipt, Building2, CheckCircle2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            Bill OS
          </Link>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-full border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  ログイン
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                  会員登録
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                ダッシュボードへ
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white px-6 py-20 md:py-32">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
            経営の意思決定を、
            <br />
            もっと速く。
          </h1>
          <p className="mb-4 text-xl font-medium text-slate-600 md:text-2xl">
            次世代クラウド請求管理プラットフォーム
          </p>
          <p className="mx-auto mb-10 max-w-3xl text-lg text-slate-500">
            Bill OSは、見積・請求・入金管理を一元化し、組織のガバナンス強化と経理DXを同時に実現します。
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-blue-700">
                  今すぐ始める
                  <ArrowRight className="h-5 w-5" />
                </button>
              </SignUpButton>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                お問い合わせ
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-blue-700"
              >
                ダッシュボードを開く
                <ArrowRight className="h-5 w-5" />
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Features Grid (Bento Grid) */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
              企業の請求業務を、根本から変える
            </h2>
            <p className="text-lg text-slate-600">
              経理部門の業務効率を最大化する機能群
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Feature 1: インボイス制度対応 */}
            <div className="group rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 shadow-sm transition hover:shadow-lg">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                <Receipt className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-900">
                インボイス制度対応
              </h3>
              <p className="mb-4 text-slate-600">
                T番号の自動チェック、適格請求書のワンクリック発行。法改正にも自動対応し、コンプライアンスを維持します。
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span>適格請求書の自動生成</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span>T番号の検証機能</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span>電子帳簿保存法対応</span>
                </li>
              </ul>
            </div>

            {/* Feature 2: 堅牢なセキュリティ */}
            <div className="group rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 shadow-sm transition hover:shadow-lg">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-900">
                堅牢なセキュリティ
              </h3>
              <p className="mb-4 text-slate-600">
                24時間365日の監視体制、多層的な権限管理により、企業の機密情報を徹底保護します。
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>エンタープライズ級暗号化</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>ロールベースアクセス制御</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>監査ログの完全記録</span>
                </li>
              </ul>
            </div>

            {/* Feature 3: 経営ダッシュボード */}
            <div className="group rounded-3xl border border-slate-200 bg-gradient-to-br from-purple-50 to-pink-50 p-8 shadow-sm transition hover:shadow-lg">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg">
                <BarChart3 className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-900">
                経営ダッシュボード
              </h3>
              <p className="mb-4 text-slate-600">
                売上推移、入金予定をリアルタイム可視化。データドリブンな意思決定を支援します。
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  <span>リアルタイム売上分析</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  <span>入金予測の可視化</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  <span>カスタムレポート生成</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Building2 className="mx-auto mb-6 h-16 w-16 text-white/90" />
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            まずは14日間、無料でお試しください
          </h2>
          <p className="mb-8 text-lg text-blue-100">
            クレジットカード登録不要。導入サポートも無料でご利用いただけます。
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-blue-600 shadow-lg transition hover:bg-blue-50">
                  無料トライアルを開始
                  <ArrowRight className="h-5 w-5" />
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-blue-600 shadow-lg transition hover:bg-blue-50"
              >
                ダッシュボードを開く
                <ArrowRight className="h-5 w-5" />
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-bold text-slate-900">
                Bill OS
              </h3>
              <p className="text-sm text-slate-600">
                次世代クラウド請求管理プラットフォーム
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-slate-900">
                製品
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <Link href="/features" className="hover:text-blue-600">
                    機能一覧
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-blue-600">
                    料金プラン
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-blue-600">
                    セキュリティ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-slate-900">
                企業情報
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <Link href="/about" className="hover:text-blue-600">
                    会社概要
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-blue-600">
                    お問い合わせ
                  </Link>
                </li>
                <li>
                  <Link href="/legal" className="hover:text-blue-600">
                    利用規約
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-slate-900">
                サポート
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <Link href="/docs" className="hover:text-blue-600">
                    ヘルプセンター
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-blue-600">
                    プライバシーポリシー
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 text-center text-sm text-slate-600">
            <p>&copy; {new Date().getFullYear()} Bill OS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
