"use client";

import { useState, Suspense, lazy } from "react";
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

const Hero3D = lazy(() => import("@/components/hero-3d"));

/* ── coming soon badge ───────────────────────────────────── */

function ComingSoonBadge({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const styles = {
    sm: "px-3 py-1 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3.5 text-base gap-2.5",
  };
  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border-2 border-dashed border-white/30 bg-white/10 text-white select-none backdrop-blur-sm ${styles[size]}`}
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
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: Receipt,
      title: "見積書作成",
      desc: "テンプレートから素早く作成。請求書への変換もワンクリック。",
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      icon: CreditCard,
      title: "支払管理",
      desc: "受取請求書を登録し、支払期限を管理。払い忘れを防止。",
      color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    },
    {
      icon: BarChart3,
      title: "経費管理",
      desc: "領収書スキャンで経費を自動登録。月次レポートも自動生成。",
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      icon: Brain,
      title: "AIメモ入力",
      desc: "自然言語のメモから請求書・経費を自動生成。入力の手間を大幅削減。",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      icon: Upload,
      title: "書類OCR読み取り",
      desc: "PDFや画像をアップロードするだけで、データを自動抽出。",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      icon: TrendingUp,
      title: "財務サマリー",
      desc: "売上・未回収・経費をグラフでリアルタイム把握。",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      icon: FileStack,
      title: "一括操作",
      desc: "複数ファイルをまとめてインポート。大量処理も効率的に。",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* ── navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#080808]/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2.5 shrink-0">
              <Image src="/logo.png" alt="Billia" width={32} height={32} className="object-contain" />
              <span className="font-bold text-[1.1rem] tracking-tight text-white">Billia</span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm text-white/50">
              <a href="#features" className="hover:text-white transition-colors">機能</a>
              <a href="#ai" className="hover:text-white transition-colors">AI機能</a>
              <a href="#pricing" className="hover:text-white transition-colors">料金</a>
            </nav>

            <div className="hidden md:block">
              <ComingSoonBadge size="sm" />
            </div>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#080808] px-5 py-4 space-y-3">
            <a href="#features" className="block text-sm text-white/60" onClick={() => setMenuOpen(false)}>機能</a>
            <a href="#ai" className="block text-sm text-white/60" onClick={() => setMenuOpen(false)}>AI機能</a>
            <a href="#pricing" className="block text-sm text-white/60" onClick={() => setMenuOpen(false)}>料金</a>
          </div>
        )}
      </header>

      {/* ── hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-14">
        {/* subtle grid bg */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* glow blobs */}
        <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #4466ff 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #00ddff 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #ff44aa 0%, transparent 70%)" }} />

        <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8 w-full">
          <div className="flex flex-col items-center">
            {/* badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/60 mb-8 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              AIで請求業務を自動化
            </div>

            {/* big text + 3D object layout */}
            <div className="relative w-full flex flex-col items-center">
              {/* line 1: BILLIA — 塗り白 + アウトライン重ね */}
              <h1
                className="font-black tracking-tighter leading-none text-center select-none relative"
                style={{
                  fontSize: "clamp(5rem, 18vw, 18rem)",
                  letterSpacing: "-0.02em",
                }}
              >
                {/* 背面: アウトライン文字（透過） */}
                <span
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    color: "transparent",
                    WebkitTextStroke: "2px rgba(255,255,255,0.12)",
                  }}
                >
                  BILLIA
                </span>
                {/* 前面: グラデーション塗り */}
                <span
                  className="relative bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(160deg, #ffffff 0%, rgba(255,255,255,0.75) 50%, rgba(180,210,255,0.6) 100%)",
                  }}
                >
                  BILLIA
                </span>
              </h1>

              {/* 3D gem overlaid on text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: "-10%" }}>
                <div style={{ width: "clamp(220px, 28vw, 480px)", height: "clamp(220px, 28vw, 480px)" }}>
                  <Suspense fallback={null}>
                    <Hero3D />
                  </Suspense>
                </div>
              </div>

              {/* tagline below */}
              <div className="mt-4 flex flex-col items-center gap-1 z-10">
                <p className="text-white/40 text-sm md:text-base tracking-widest uppercase font-light">
                  AI-Powered Invoice Management
                </p>
              </div>
            </div>

            {/* sub text */}
            <p className="mt-8 text-white/40 text-sm md:text-base leading-relaxed text-center max-w-md">
              請求書・見積書・経費・支払管理をひとつに。
              <br />
              AIがメモや書類を読み取り、入力の手間をゼロへ。
            </p>

            <div className="mt-10">
              <ComingSoonBadge size="lg" />
            </div>
          </div>
        </div>

        {/* scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      {/* ── feature grid ── */}
      <section id="features" className="py-24 md:py-32 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="mb-14">
            <p className="text-xs tracking-widest uppercase text-white/30 mb-3">Features</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              請求業務に必要な機能が<br />すべて揃う
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {features.map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl border bg-white/[0.02] p-5 hover:bg-white/[0.05] transition-colors ${f.color.split(" ")[2]}`}
              >
                <div className={`inline-flex rounded-xl p-2.5 mb-3 border ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1">{f.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI feature ── */}
      <section id="ai" className="py-24 md:py-32 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="mb-14">
            <p className="text-xs tracking-widest uppercase text-white/30 mb-3">AI Features</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              入力の手間を、<br />
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #4466ff, #00ddff)" }}>
                限りなくゼロへ
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Brain,
                title: "メモから自動生成",
                desc: "日本語の自然なメモを入力するだけで、請求書・見積書・経費を自動生成。",
                example: '"山田商事に12月分 24万 請求、来月15日払い"',
                color: "from-purple-500/10 border-purple-500/20 text-purple-400",
              },
              {
                icon: Upload,
                title: "書類をそのままインポート",
                desc: "PDFや画像をアップロードすると、OCRで取引先・金額・日付を自動抽出。",
                tags: ["PDF", "JPEG", "PNG", "HEIC"],
                color: "from-blue-500/10 border-blue-500/20 text-blue-400",
              },
              {
                icon: BarChart3,
                title: "経費を自動分類",
                desc: "領収書スキャン時に、経費カテゴリをAIが自動で判定して分類します。",
                tags: ["通信費", "外注費", "旅費", "消耗品"],
                color: "from-emerald-500/10 border-emerald-500/20 text-emerald-400",
              },
            ].map((card) => (
              <div
                key={card.title}
                className={`rounded-2xl border bg-gradient-to-b ${card.color.split(" ")[0]} to-transparent ${card.color.split(" ")[1]} p-6`}
              >
                <div className={`inline-flex rounded-xl bg-white/5 p-2.5 mb-4 ${card.color.split(" ")[2]}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed mb-4">{card.desc}</p>
                {card.example && (
                  <div className="rounded-lg bg-white/5 border border-white/5 px-3 py-2">
                    <p className="text-[11px] text-white/30 italic mb-1">入力例</p>
                    <p className="text-xs text-white/60">{card.example}</p>
                  </div>
                )}
                {card.tags && (
                  <div className="flex flex-wrap gap-1.5">
                    {card.tags.map((t) => (
                      <span key={t} className="text-[10px] font-medium bg-white/5 text-white/50 px-2 py-0.5 rounded-full border border-white/10">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── pricing ── */}
      <section id="pricing" className="py-24 md:py-32 border-t border-white/5">
        <div className="mx-auto max-w-4xl px-5 md:px-8 text-center">
          <p className="text-xs tracking-widest uppercase text-white/30 mb-3">Pricing</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
            シンプルな料金体系
          </h2>
          <p className="text-white/40 mb-12 max-w-md mx-auto text-sm">
            すべての機能が使える、月額定額プランのみ。
          </p>

          <div className="max-w-sm mx-auto">
            <div className="rounded-3xl p-8 text-left relative overflow-hidden border border-white/10"
              style={{ background: "linear-gradient(135deg, rgba(68,102,255,0.2) 0%, rgba(0,221,255,0.1) 100%)" }}>
              <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #4466ff 0%, transparent 70%)" }} />

              <div className="relative">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-semibold text-white/70 mb-6">
                  <Sparkles className="w-3 h-3" />
                  All-inclusive Plan
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-5xl font-black text-white">¥1,000</span>
                    <span className="text-white/40 mb-2 text-sm">/ 月</span>
                  </div>
                  <p className="text-white/30 text-sm">税込み・いつでもキャンセル可能</p>
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
                    <li key={item} className="flex items-start gap-2.5 text-sm text-white/60">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
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
      <section className="py-24 md:py-32 border-t border-white/5">
        <div className="mx-auto max-w-4xl px-5 md:px-8 text-center">
          <p className="text-xs tracking-widest uppercase text-white/30 mb-3">How it works</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-14">
            3ステップで始められる
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: ShieldCheck, title: "アカウント作成", desc: "メールアドレスだけで登録。すぐに使い始められます。", color: "text-blue-400 bg-blue-400/10" },
              { step: "02", icon: Upload, title: "書類をインポート", desc: "請求書・見積書・領収書をアップロード。AIが自動でデータを抽出します。", color: "text-purple-400 bg-purple-400/10" },
              { step: "03", icon: Zap, title: "業務を自動化", desc: "ステータス管理・入金確認・経費登録がすべてひとつの場所で完結。", color: "text-cyan-400 bg-cyan-400/10" },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="text-5xl font-black text-white/5 mb-3 select-none">{s.step}</div>
                <div className={`inline-flex rounded-2xl p-3 mb-4 ${s.color}`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── cta ── */}
      <section className="py-24 md:py-32 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="rounded-3xl p-10 md:p-16 text-center border border-white/10 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(68,102,255,0.15) 0%, rgba(0,221,255,0.08) 100%)" }}>
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] opacity-20 blur-3xl"
              style={{ background: "radial-gradient(ellipse, #4466ff 0%, transparent 70%)" }} />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                もうすぐリリース
              </h2>
              <p className="text-white/40 mb-8 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                月額¥1,000で、AIを活用した請求業務の自動化を体験してください。
              </p>
              <ComingSoonBadge size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* ── footer ── */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Billia" width={24} height={24} className="object-contain opacity-60" />
              <span className="font-bold text-sm text-white/40">Billia</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/20">
              <a href="#features" className="hover:text-white/50 transition-colors">機能</a>
              <a href="#ai" className="hover:text-white/50 transition-colors">AI機能</a>
              <a href="#pricing" className="hover:text-white/50 transition-colors">料金</a>
            </div>
            <p className="text-xs text-white/20">© 2025 Billia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
