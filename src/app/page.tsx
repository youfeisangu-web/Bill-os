"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FileText,
  Receipt,
  Brain,
  BarChart3,
  CreditCard,
  Zap,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  FileStack,
  ShieldCheck,
  Upload,
  Clock,
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

/* ── coming soon badge ───────────────────────────────────── */

function ComingSoonBadge({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const styles = {
    sm: "px-3 py-1 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3.5 text-base gap-2.5",
  };
  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 select-none ${styles[size]}`}
    >
      <Clock className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
      Coming Soon
    </span>
  );
}

/* ── main page ───────────────────────────────────────────── */

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

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
            <div className="flex items-center gap-2.5 shrink-0">
              <Image src="/logo.png" alt="Billia" width={32} height={32} className="object-contain" />
              <span className="font-bold text-[1.1rem] tracking-tight text-slate-900">Billia</span>
            </div>

            {/* desktop nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
              <a href="#features" className="hover:text-slate-900 transition-colors">機能</a>
              <a href="#ai" className="hover:text-slate-900 transition-colors">AI機能</a>
              <a href="#pricing" className="hover:text-slate-900 transition-colors">料金</a>
            </nav>

            {/* coming soon badge desktop */}
            <div className="hidden md:block">
              <ComingSoonBadge size="sm" />
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
            <a href="#pricing" className="block text-sm text-slate-600" onClick={() => setMenuOpen(false)}>料金</a>
            <div className="pt-2">
              <ComingSoonBadge size="sm" />
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

            <ComingSoonBadge size="lg" />
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
          <div className="text-center mb-12">
            <p className="billia-label mb-3">AI機能</p>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-4">
              入力の手間を、<br className="md:hidden" />
              <span className="text-purple-600">限りなくゼロへ</span>
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
              3つのAI機能で、書類作成・データ入力のあらゆる手間を自動化します。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {/* AI card 1 */}
            <div className="rounded-2xl border border-purple-100 bg-gradient-to-b from-purple-50 to-white p-6">
              <div className="inline-flex rounded-xl bg-purple-100 p-2.5 mb-4">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">メモから自動生成</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                日本語の自然なメモを入力するだけで、請求書・見積書・経費を自動生成。
                取引先・金額・期日をAIが読み取ります。
              </p>
              <div className="rounded-lg bg-white border border-purple-100 px-3 py-2">
                <p className="text-[11px] text-slate-400 italic mb-1">入力例</p>
                <p className="text-xs text-slate-600">"山田商事に12月分 24万 請求、来月15日払い"</p>
              </div>
            </div>

            {/* AI card 2 */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-6">
              <div className="inline-flex rounded-xl bg-blue-100 p-2.5 mb-4">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">書類をそのままインポート</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                請求書・見積書・領収書のPDFや画像をアップロードすると、
                OCRで取引先・金額・日付・明細を自動抽出してデータ登録。
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["PDF", "JPEG", "PNG", "HEIC", "WebP"].map((f) => (
                  <span key={f} className="text-[10px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{f}</span>
                ))}
              </div>
            </div>

            {/* AI card 3 */}
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-6">
              <div className="inline-flex rounded-xl bg-emerald-100 p-2.5 mb-4">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">経費を自動分類</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                領収書のスキャンやメモ入力時に、通信費・外注費・旅費交通費などの
                経費カテゴリをAIが自動で判定して分類します。
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["通信費", "外注費", "旅費交通費", "消耗品"].map((c) => (
                  <span key={c} className="text-[10px] font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{c}</span>
                ))}
              </div>
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
                売上・経費・未回収を<br />
                <span className="text-cyan-600">ひとつの画面で確認</span>
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                今月の請求額・未入金・経費をダッシュボードにまとめて表示。
                払い忘れや未回収をすぐに把握できます。
              </p>
              <ul className="space-y-3">
                {[
                  "今月の請求額・未入金をひと目で確認",
                  "経費の月次合計を自動集計",
                  "支払期限が近い請求書をすぐ把握",
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

      {/* ── mobile section ── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* phone mockups */}
            <div className="flex justify-center gap-4 md:gap-6">
              {/* phone 1 */}
              <div className="w-[140px] md:w-[160px] rounded-[2rem] border-4 border-slate-200 bg-white shadow-2xl overflow-hidden shrink-0">
                <div className="bg-slate-100 h-5 flex items-center justify-center">
                  <div className="w-10 h-1.5 rounded-full bg-slate-300" />
                </div>
                <div className="p-2.5 space-y-2">
                  <p className="text-[9px] font-semibold text-slate-400">2026年3月</p>
                  <p className="text-[11px] font-bold text-slate-800">ダッシュボード</p>
                  <div className="rounded-lg bg-red-50 border border-red-100 px-2 py-1.5 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <div>
                      <p className="text-[8px] font-semibold text-red-600">未入金があります</p>
                      <p className="text-[7px] text-red-400">¥447,700</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { label: "今月の請求額", value: "¥78,100", color: "text-slate-800" },
                      { label: "未入金", value: "¥447,700", color: "text-red-600" },
                      { label: "今月の経費", value: "¥11,500", color: "text-slate-800" },
                      { label: "前月比", value: "+0.0%", color: "text-emerald-600" },
                    ].map((k) => (
                      <div key={k.label} className="rounded-md bg-slate-50 border border-slate-100 px-1.5 py-1">
                        <p className="text-[7px] text-slate-400">{k.label}</p>
                        <p className={`text-[9px] font-bold ${k.color}`}>{k.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-md bg-slate-50 border border-slate-100 px-1.5 py-1.5">
                    <p className="text-[7px] text-slate-400 mb-1">クイックアクション</p>
                    <div className="grid grid-cols-2 gap-1">
                      {["請求書を作成", "見積書を作成", "経費を記録", "入金消込"].map((a) => (
                        <div key={a} className="rounded bg-white border border-slate-100 px-1 py-1 text-center">
                          <p className="text-[7px] text-slate-600">{a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* phone 2 */}
              <div className="w-[140px] md:w-[160px] rounded-[2rem] border-4 border-slate-200 bg-white shadow-2xl overflow-hidden shrink-0">
                <div className="bg-slate-100 h-5 flex items-center justify-center">
                  <div className="w-10 h-1.5 rounded-full bg-slate-300" />
                </div>
                <div className="p-2.5 space-y-2">
                  <p className="text-[9px] font-semibold text-slate-400">請求書</p>
                  <p className="text-[11px] font-bold text-slate-800">請求書一覧</p>
                  <div className="space-y-1.5">
                    {[
                      { name: "サンプル商事", amount: "¥78,100", status: "未払い", sc: "bg-amber-100 text-amber-700" },
                      { name: "株式会社ビリオ", amount: "¥11,000", status: "支払済", sc: "bg-emerald-100 text-emerald-700" },
                      { name: "佐藤健二", amount: "¥11,000", status: "支払済", sc: "bg-emerald-100 text-emerald-700" },
                    ].map((item) => (
                      <div key={item.name} className="rounded-md border border-slate-100 px-1.5 py-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[8px] font-medium text-blue-600 truncate max-w-[70px]">INV-2026</p>
                          <span className={`text-[7px] px-1 py-0.5 rounded-full font-medium ${item.sc}`}>{item.status}</span>
                        </div>
                        <p className="text-[8px] text-slate-700 truncate">{item.name}</p>
                        <p className="text-[9px] font-bold text-slate-800">{item.amount}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* text */}
            <div>
              <p className="billia-label mb-3">モバイル対応</p>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-5">
                スマホでも、<br />
                <span className="text-blue-600">サクサク動く</span>
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                PCだけではありません。Billiaはスマートフォンにも完全対応。
                外出先でも移動中でも、急な請求書の発行や入金確認がその場ですぐにできます。
              </p>
              <ul className="space-y-3">
                {[
                  "スマートフォンに最適化されたUI",
                  "外出先からでも請求書を即発行",
                  "入金確認・ステータス更新もモバイルから",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── pricing ── */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5 md:px-8 text-center">
          <p className="billia-label mb-3">料金</p>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-4">
            シンプルな料金体系
          </h2>
          <p className="text-slate-500 mb-12 max-w-md mx-auto">
            すべての機能が使える、月額定額プランのみ。隠れた費用は一切なし。
          </p>

          <div className="max-w-sm mx-auto">
            <div
              className="rounded-3xl p-8 text-left relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #06b6d4 100%)",
              }}
            >
              {/* shimmer decoration */}
              <div
                className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
              />

              <div className="relative">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white mb-6">
                  <Sparkles className="w-3 h-3" />
                  All-inclusive Plan
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-5xl font-black text-white">¥1,000</span>
                    <span className="text-blue-200 mb-2 text-sm">/ 月</span>
                  </div>
                  <p className="text-blue-100 text-sm">税込み・いつでもキャンセル可能</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    "請求書・見積書の作成・管理（無制限）",
                    "受取請求書・支払管理",
                    "経費管理・領収書スキャン",
                    "AIメモ入力・書類OCR読み取り",
                    "財務サマリー・グラフ表示",
                    "複数ファイル一括インポート",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-blue-50">
                      <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="flex justify-center">
                  <ComingSoonBadge size="md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── how it works ── */}
      <section id="how" className="py-20 md:py-28 bg-slate-50">
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
                desc: "メールアドレスだけで登録。すぐに使い始められます。",
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
              もうすぐリリース
            </h2>
            <p className="text-blue-100 mb-8 text-sm md:text-base max-w-md mx-auto leading-relaxed">
              月額¥1,000で、AIを活用した請求業務の自動化を体験してください。
              公開をお楽しみに。
            </p>
            <ComingSoonBadge size="lg" />
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
              <a href="#pricing" className="hover:text-slate-600 transition-colors">料金</a>
            </div>
            <p className="text-xs text-slate-400">© 2025 Billia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
