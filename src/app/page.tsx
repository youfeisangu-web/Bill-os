"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Receipt,
  Brain,
  BarChart3,
  CreditCard,
  Zap,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  FileStack,
  Clock,
  ShieldCheck,
  Upload,
} from "lucide-react";

/* ── inline mini mockups ─────────────────────────────────── */

function DashboardMockup() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg p-4 w-full text-xs">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-red-400" />
        <div className="w-2 h-2 rounded-full bg-yellow-400" />
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <span className="ml-2 text-slate-400 text-[10px]">Billia ダッシュボード</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "今月売上", value: "¥1,240,000", color: "text-blue-600" },
          { label: "未回収", value: "¥320,000", color: "text-amber-600" },
          { label: "経費合計", value: "¥89,500", color: "text-slate-600" },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
            <p className="text-[9px] text-slate-400">{k.label}</p>
            <p className={`font-bold text-[11px] ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {["山田商事", "株式会社ABC", "田中工務店"].map((name, i) => (
          <div key={name} className="flex items-center justify-between rounded-lg border border-slate-100 px-2 py-1.5">
            <span className="text-slate-600">{name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              i === 0 ? "bg-green-100 text-green-700" : i === 1 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
            }`}>
              {i === 0 ? "入金済" : i === 1 ? "未回収" : "送付済"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoiceListMockup() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg p-4 w-full text-xs">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-slate-700 text-[11px]">請求書一覧</span>
        <div className="flex gap-1">
          <span className="bg-blue-100 text-blue-700 text-[9px] px-2 py-0.5 rounded-full">すべて</span>
          <span className="bg-slate-100 text-slate-500 text-[9px] px-2 py-0.5 rounded-full">未回収</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {[
          { name: "株式会社山田商事", amount: "¥240,000", status: "入金済", color: "bg-emerald-100 text-emerald-700" },
          { name: "田中製作所", amount: "¥180,000", status: "未回収", color: "bg-amber-100 text-amber-700" },
          { name: "鈴木コンサルティング", amount: "¥95,000", status: "送付済", color: "bg-blue-100 text-blue-700" },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-lg border border-slate-100 px-2 py-1.5">
            <div>
              <p className="text-slate-700 text-[10px]">{item.name}</p>
              <p className="text-slate-400 text-[9px]">2025-12-15</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800 text-[11px]">{item.amount}</p>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${item.color}`}>{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MemoMockup() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg p-4 w-full text-xs">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
        <span className="font-semibold text-slate-700 text-[11px]">AIメモ読み取り</span>
      </div>
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 mb-2">
        <p className="text-slate-500 text-[10px] italic">"山田商事に12月分 24万 請求、来月15日払い"</p>
      </div>
      <div className="flex items-center gap-1 text-[9px] text-slate-400 mb-2">
        <div className="w-3 h-3 rounded-full bg-purple-100 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
        </div>
        AIが解析中...
      </div>
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-2 space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-500 text-[9px]">取引先</span>
          <span className="font-medium text-slate-700 text-[9px]">山田商事</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 text-[9px]">金額</span>
          <span className="font-medium text-slate-700 text-[9px]">¥240,000</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 text-[9px]">支払期限</span>
          <span className="font-medium text-slate-700 text-[9px]">翌月15日</span>
        </div>
      </div>
    </div>
  );
}

function FinanceMockup() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg p-4 w-full text-xs">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
        <span className="font-semibold text-slate-700 text-[11px]">財務サマリー</span>
      </div>
      <div className="space-y-2">
        {[
          { month: "10月", amount: 820000, bar: "65%" },
          { month: "11月", amount: 1040000, bar: "82%" },
          { month: "12月", amount: 1280000, bar: "100%" },
        ].map((item) => (
          <div key={item.month} className="flex items-center gap-2">
            <span className="text-slate-400 text-[9px] w-5">{item.month}</span>
            <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                style={{ width: item.bar }}
              />
            </div>
            <span className="text-slate-700 font-medium text-[9px] w-14 text-right">
              ¥{(item.amount / 10000).toFixed(0)}万
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between">
        <span className="text-slate-400 text-[9px]">未回収率</span>
        <span className="font-bold text-amber-600 text-[11px]">12.4%</span>
      </div>
    </div>
  );
}

/* ── main page ───────────────────────────────────────────── */

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const ctaHref = isLoaded && isSignedIn ? "/dashboard" : "/sign-up";
  const ctaLabel = isLoaded && isSignedIn ? "ダッシュボードへ" : "無料で始める";

  const features = [
    {
      icon: FileText,
      title: "請求書管理",
      desc: "発行・送付・入金確認まで一元管理。ステータスが一目でわかる。",
      color: "text-blue-500 bg-blue-50",
    },
    {
      icon: Receipt,
      title: "見積書作成",
      desc: "テンプレートから素早く作成。請求書への変換もワンクリック。",
      color: "text-indigo-500 bg-indigo-50",
    },
    {
      icon: CreditCard,
      title: "支払管理",
      desc: "受取請求書を登録し、支払期限を管理。払い忘れを防止。",
      color: "text-violet-500 bg-violet-50",
    },
    {
      icon: BarChart3,
      title: "経費管理",
      desc: "領収書スキャンで経費を自動登録。月次レポートも自動生成。",
      color: "text-cyan-500 bg-cyan-50",
    },
    {
      icon: Brain,
      title: "AIメモ入力",
      desc: "自然言語のメモから請求書・経費を自動生成。入力の手間を大幅削減。",
      color: "text-purple-500 bg-purple-50",
    },
    {
      icon: Upload,
      title: "書類OCR読み取り",
      desc: "PDFや画像をアップロードするだけで、データを自動抽出。",
      color: "text-emerald-500 bg-emerald-50",
    },
    {
      icon: TrendingUp,
      title: "財務サマリー",
      desc: "売上・未回収・経費をグラフでリアルタイム把握。",
      color: "text-amber-500 bg-amber-50",
    },
    {
      icon: FileStack,
      title: "一括操作",
      desc: "複数ファイルをまとめてインポート。大量処理も効率的に。",
      color: "text-rose-500 bg-rose-50",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ── navbar ── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image src="/logo.png" alt="Billia" width={32} height={32} className="object-contain" />
              <span className="font-bold text-[1.1rem] tracking-tight text-slate-900">Billia</span>
            </Link>

            {/* desktop nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
              <a href="#features" className="hover:text-slate-900 transition-colors">機能</a>
              <a href="#ai" className="hover:text-slate-900 transition-colors">AI機能</a>
              <a href="#how" className="hover:text-slate-900 transition-colors">使い方</a>
            </nav>

            {/* desktop ctas */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href={isLoaded && isSignedIn ? "/dashboard" : "/sign-in"}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                ログイン
              </Link>
              <Link
                href={ctaHref}
                className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
              >
                {ctaLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="メニュー"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-5 py-4 space-y-3">
            <a href="#features" className="block text-sm text-slate-600" onClick={() => setMenuOpen(false)}>機能</a>
            <a href="#ai" className="block text-sm text-slate-600" onClick={() => setMenuOpen(false)}>AI機能</a>
            <a href="#how" className="block text-sm text-slate-600" onClick={() => setMenuOpen(false)}>使い方</a>
            <div className="pt-2 flex flex-col gap-2">
              <Link href={isLoaded && isSignedIn ? "/dashboard" : "/sign-in"} className="text-center text-sm font-medium text-slate-700 border border-slate-200 rounded-full py-2">
                ログイン
              </Link>
              <Link href={ctaHref} className="text-center text-sm font-semibold text-white bg-blue-600 rounded-full py-2">
                {ctaLabel}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── hero ── */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        {/* gradient mesh background */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 10%, rgba(96,165,250,0.18) 0%, transparent 60%),
              radial-gradient(ellipse 60% 50% at 80% 20%, rgba(99,102,241,0.14) 0%, transparent 55%),
              radial-gradient(ellipse 70% 60% at 50% 100%, rgba(34,211,238,0.12) 0%, transparent 50%),
              #ffffff
            `,
          }}
        />

        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            {/* badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AIで請求業務を自動化
            </div>

            {/* headline */}
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-5">
              AIで、請求管理を
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #2563eb 0%, #06b6d4 50%, #6366f1 100%)" }}
              >
                もっとラクに。
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-500 leading-relaxed mb-8 max-w-xl mx-auto">
              請求書・見積書・経費・支払管理をひとつに。
              AIがメモや書類を読み取り、入力の手間を限りなくゼロへ。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 hover:shadow-blue-300"
              >
                {ctaLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
              {(!isLoaded || !isSignedIn) && (
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  ログイン
                </Link>
              )}
            </div>
          </div>

          {/* mockup grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto md:max-w-none md:grid-cols-4">
            <DashboardMockup />
            <InvoiceListMockup />
            <MemoMockup />
            <FinanceMockup />
          </div>
        </div>
      </section>

      {/* ── feature grid ── */}
      <section id="features" className="py-20 md:py-28 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="text-center mb-12">
            <p className="billia-label mb-2">機能一覧</p>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              請求業務に必要な機能が<br className="md:hidden" />すべて揃う
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
                <div className={`inline-flex rounded-xl p-2.5 mb-3 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 mb-1">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI feature ── */}
      <section id="ai" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="billia-label mb-3">AI機能</p>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-5">
                メモを書くだけで<br />
                <span className="text-purple-600">請求書が完成する</span>
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                「山田商事に12月分 24万 請求、来月15日払い」—
                こんな自然な言葉を入力するだけで、AIが取引先・金額・支払期限を読み取り、
                請求書を自動生成します。
              </p>
              <ul className="space-y-3">
                {[
                  "自然言語のメモから請求書・経費を自動生成",
                  "PDFや画像の書類をOCRでデータ抽出",
                  "領収書スキャンで経費を即登録",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="max-w-xs mx-auto md:max-w-none">
              <MemoMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── finance section ── */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="max-w-xs mx-auto md:max-w-none md:order-1">
              <FinanceMockup />
            </div>
            <div className="md:order-2">
              <p className="billia-label mb-3">財務サマリー</p>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-5">
                お金の流れを<br />
                <span className="text-cyan-600">リアルタイムで把握</span>
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                売上・未回収・経費をひとつの画面でまとめて確認。
                月次の収支推移グラフで、ビジネスの健全性を一目でチェックできます。
              </p>
              <ul className="space-y-3">
                {[
                  "月次売上・経費のグラフ表示",
                  "未回収請求書の金額・件数をひと目で確認",
                  "支払期限が近い請求書のアラート",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── how it works ── */}
      <section id="how" className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5 md:px-8 text-center">
          <p className="billia-label mb-3">使い方</p>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-12">
            3ステップで始められる
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: ShieldCheck,
                title: "アカウント作成",
                desc: "メールアドレスだけで無料登録。すぐに使い始められます。",
                color: "text-blue-500 bg-blue-50",
              },
              {
                step: "02",
                icon: Upload,
                title: "書類をインポート",
                desc: "請求書・見積書・領収書をアップロード。AIが自動でデータを抽出します。",
                color: "text-purple-500 bg-purple-50",
              },
              {
                step: "03",
                icon: Zap,
                title: "業務を自動化",
                desc: "ステータス管理・入金確認・経費登録がすべてひとつの場所で完結。",
                color: "text-cyan-500 bg-cyan-50",
              },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="text-4xl font-black text-slate-100 mb-3">{s.step}</div>
                <div className={`inline-flex rounded-2xl p-3 mb-4 ${s.color}`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── cta section ── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div
            className="rounded-3xl p-10 md:p-16 text-center"
            style={{
              background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #06b6d4 100%)",
            }}
          >
            <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
              今すぐ請求業務を効率化しよう
            </h2>
            <p className="text-blue-100 mb-8 text-sm md:text-base max-w-md mx-auto leading-relaxed">
              Billiaは無料でご利用いただけます。
              面倒な請求業務から解放されて、本来の仕事に集中しましょう。
            </p>
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-50"
            >
              {ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── footer ── */}
      <footer className="border-t border-slate-100 py-10">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Billia" width={24} height={24} className="object-contain" />
              <span className="font-bold text-sm text-slate-700">Billia</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
              <a href="#features" className="hover:text-slate-600 transition-colors">機能</a>
              <a href="#ai" className="hover:text-slate-600 transition-colors">AI機能</a>
              <a href="#how" className="hover:text-slate-600 transition-colors">使い方</a>
              <Link href="/sign-in" className="hover:text-slate-600 transition-colors">ログイン</Link>
              <Link href="/sign-up" className="hover:text-slate-600 transition-colors">新規登録</Link>
            </div>
            <p className="text-xs text-slate-400">© 2025 Billia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
