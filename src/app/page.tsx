"use client";

import { useState, useEffect, useRef } from "react";
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
  ShieldCheck,
  Upload,
  ChevronDown,
  ArrowRight,
  Clock,
  Star,
  Users,
  Building2,
  Briefcase,
  Home,
  Mic,
  Megaphone,
  Rocket
} from "lucide-react";

/* ── coming soon badge ───────────────────────────────────── */

function ComingSoonBadge({ size = "md", color = "blue" }: { size?: "sm" | "md" | "lg"; color?: "blue" | "orange" }) {
  const styles = { sm: "px-3 py-1 text-xs gap-1.5", md: "px-5 py-2.5 text-sm gap-2", lg: "px-7 py-3.5 text-base gap-2.5" };
  const colors = { blue: "border-blue-300 bg-blue-50 text-blue-600", orange: "border-orange-300 bg-orange-50 text-orange-600" };
  return (
    <span className={`inline-flex items-center font-bold rounded-full border-2 border-dashed select-none ${styles[size]} ${colors[color]}`}>
      <Clock className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
      Coming Soon
    </span>
  );
}

/* ── mockups (Neo-Futuristic Edition) ───────────────────────── */

const glass = "rounded-[24px] border border-white/60 bg-white/40 backdrop-blur-3xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.1)] p-6 w-full text-xs transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:bg-white/60 hover:-translate-y-2 hover:shadow-[0_45px_100px_-15px_rgba(0,0,0,0.2)]";

function DashboardMockup() {
  return (
    <div className={glass}>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.4)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.4)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
        </div>
        <span className="ml-1 font-bold tracking-widest uppercase text-[9px] text-black/40">システム要約</span>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "売上高", value: "¥1,240K" },
          { label: "未回収", value: "¥320K" },
          { label: "経費", value: "¥89.5K" },
        ].map((k, i) => (
          <div key={k.label} className="rounded-2xl border border-black/5 bg-white/50 shadow-sm p-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-out" />
            <p className="text-[8px] font-bold tracking-[0.2em] text-black/40 mb-1.5">{k.label}</p>
            <p className={`font-mono text-[15px] font-extrabold tracking-tight tabular-nums ${i === 1 ? 'text-amber-600' : 'text-black'}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {["山田商事", "株式会社ABC", "田中工務店"].map((name, i) => (
          <div key={name} className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/60 px-4 py-3 cursor-pointer hover:bg-white transition-colors">
            <span className="font-bold text-black/80">{name}</span>
            <span className={`text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-lg uppercase shadow-sm ${
              i === 0 ? "bg-black text-white" : i === 1 ? "bg-amber-100 text-amber-800" : "bg-black/5 text-black/60"
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
    <div className={glass}>
      <div className="flex items-center justify-between mb-6">
        <span className="font-extrabold text-black text-[14px] tracking-tight">請求状況</span>
        <div className="flex gap-1.5 p-1 rounded-xl bg-black/5 backdrop-blur-md border border-black/5">
          <span className="bg-white text-black text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-sm cursor-pointer">すべて</span>
          <span className="text-black/60 hover:text-black hover:bg-white/50 text-[9px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all">未回収</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {[
          { name: "山田商事", amount: "¥240,000", status: "入金済", dark: true },
          { name: "田中製作所", amount: "¥180,000", status: "未回収", dark: false },
          { name: "鈴木コンサルティング", amount: "¥95,000", status: "送付済", dark: false },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/50 px-4 py-3 group cursor-pointer hover:border-black/10 hover:bg-white hover:shadow-lg transition-all duration-300">
            <div>
              <p className="font-extrabold text-black text-[12px] mb-1">{item.name}</p>
              <p className="font-mono text-black/40 text-[10px] tracking-widest tabular-nums font-semibold">2026.03.15</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <p className="font-mono font-extrabold text-black text-[14px] tracking-tight tabular-nums mb-1.5">{item.amount}</p>
              <span className={`text-[8px] px-2.5 py-0.5 rounded-md font-bold tracking-widest ${item.dark ? "bg-black text-white shadow-md" : "bg-black/10 text-black/60"}`}>{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MemoMockup() {
  return (
    <div className={glass}>
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center shadow-lg shadow-black/20">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-extrabold text-black text-[14px] tracking-tight">AI アシスタント</span>
      </div>
      <div className="rounded-2xl bg-black/5 border border-black/5 p-4 mb-4 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s] ease-in-out" />
        <div className="flex items-center gap-2 mb-2 relative">
          <div className="flex items-center gap-1.5 bg-black text-white rounded-lg px-2.5 py-1 shadow-md">
            <Mic className="w-3 h-3" />
            <span className="text-[8px] font-bold tracking-[0.2em] uppercase">音声入力</span>
          </div>
        </div>
        <p className="text-black/80 font-bold text-[12px] leading-relaxed italic relative">"山田商事に12月分 <span className="text-blue-600">24万</span> 請求、来月15日払い"</p>
      </div>
      <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.2em] uppercase text-black/40 mb-4 pl-1">
        <div className="w-3.5 h-3.5 rounded-full bg-black/10 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
        </div>
        Processing...
      </div>
      <div className="rounded-2xl border border-black/10 bg-white/80 backdrop-blur-md p-4 space-y-3 shadow-lg shadow-black/5">
        <div className="flex justify-between items-center border-b border-black/5 pb-2">
          <span className="text-black/40 text-[9px] font-bold tracking-widest uppercase">取引先</span>
          <span className="font-extrabold text-black text-[12px]">山田商事</span>
        </div>
        <div className="flex justify-between items-center border-b border-black/5 pb-2">
          <span className="text-black/40 text-[9px] font-bold tracking-widest uppercase">ご請求額</span>
          <span className="font-mono font-extrabold text-black text-[12px] tabular-nums">¥240,000</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-black/40 text-[9px] font-bold tracking-widest uppercase">期日</span>
          <span className="font-extrabold text-black text-[12px]">翌月15日</span>
        </div>
      </div>
    </div>
  );
}

function FinanceMockup() {
  return (
    <div className={glass}>
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center shadow-lg shadow-black/20">
          <TrendingUp className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-extrabold text-black text-[14px] tracking-tight">財務データ詳細</span>
      </div>
      <div className="space-y-4">
        {[
          { month: "1月", amount: 820000, bar: "65%" },
          { month: "2月", amount: 1040000, bar: "82%" },
          { month: "3月", amount: 1280000, bar: "100%" },
        ].map((item) => (
          <div key={item.month} className="flex items-center gap-3">
            <span className="text-black/40 font-bold tracking-[0.2em] text-[10px] w-8">{item.month}</span>
            <div className="flex-1 h-2 rounded-full bg-black/5 overflow-hidden">
              <div className="h-full rounded-full bg-black relative overflow-hidden" style={{ width: item.bar }}>
                 <div className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[scroll_2s_linear_infinite] -translate-x-full" />
              </div>
            </div>
            <span className="font-mono font-black text-black text-[11px] w-14 text-right tabular-nums">
              ¥{(item.amount / 10000).toFixed(0)}K
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 pt-5 border-t border-black/10 flex justify-between items-end">
        <div>
          <span className="text-black/40 text-[9px] font-bold tracking-[0.2em] uppercase block mb-1">未回収率</span>
          <span className="font-mono font-extrabold text-amber-600 text-2xl tabular-nums leading-none drop-shadow-sm">12.4%</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white hover:bg-neutral-800 transition-transform hover:scale-110 cursor-pointer shadow-lg shadow-black/20">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function TeamMockup() {
  return (
    <div className={glass}>
      <div className="flex items-center justify-between mb-6">
        <span className="font-extrabold text-black text-[14px] tracking-tight">チームメンバー</span>
        <span className="bg-black text-white text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-sm">3名 稼働中</span>
      </div>
      <div className="space-y-2 mb-4">
        {[
          { name: "山田 太郎", role: "管理者", initial: "Y", dark: true },
          { name: "鈴木 花子", role: "メンバー", initial: "S", dark: false },
          { name: "田中 一郎", role: "メンバー", initial: "T", dark: false },
        ].map((member) => (
          <div key={member.name} className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/50 px-4 py-3 group cursor-pointer hover:bg-white hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-black ${member.dark ? 'bg-black text-white' : 'bg-black/5 text-black'}`}>
                {member.initial}
              </div>
              <span className="font-extrabold text-black/80 text-[12px]">{member.name}</span>
            </div>
            <span className={`text-[8px] px-2.5 py-0.5 rounded-md font-bold tracking-widest ${member.dark ? 'bg-black text-white' : 'bg-black/10 text-black/60'}`}>{member.role}</span>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-black/5 border border-black/10 px-4 py-3 flex items-center justify-center gap-2 text-[10px] text-black font-extrabold tracking-widest uppercase cursor-pointer hover:bg-black hover:text-white transition-all shadow-sm">
        <Users className="w-4 h-4" />
        Invite Member
      </div>
    </div>
  );
}

/* ── main ────────────────────────────────────────────────── */

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [crowdfundingInView, setCrowdfundingInView] = useState(false);
  const crowdfundingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = crowdfundingRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCrowdfundingInView(true);
      },
      { threshold: 0.4, rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const features = [
    { icon: FileText, title: "請求書管理", desc: "発行・送付・入金確認まで一元管理。定期請求の自動化にも対応。", color: "text-blue-500 bg-blue-50" },
    { icon: Receipt, title: "見積書作成", desc: "テンプレートから素早く作成。請求書への変換もワンクリック。", color: "text-indigo-500 bg-indigo-50" },
    { icon: CreditCard, title: "支払管理", desc: "受取請求書を登録し、支払期限を管理。払い忘れを防止。", color: "text-violet-500 bg-violet-50" },
    { icon: BarChart3, title: "経費管理", desc: "領収書スキャンで経費を自動登録。月次レポートも自動生成。", color: "text-cyan-500 bg-cyan-50" },
    { icon: Brain, title: "AIメモ入力", desc: "自然言語のメモから請求書・経費を自動生成。入力の手間を大幅削減。", color: "text-purple-500 bg-purple-50" },
    { icon: Upload, title: "書類OCR読み取り", desc: "PDFや画像をアップロードするだけで、データを自動抽出。", color: "text-emerald-500 bg-emerald-50" },
    { icon: TrendingUp, title: "財務サマリー", desc: "売上・未回収・経費をグラフでリアルタイム把握。", color: "text-amber-500 bg-amber-50" },
    { icon: Users, title: "チーム管理", desc: "メンバーを招待して請求書・取引先データをチームで共有。", color: "text-rose-500 bg-rose-50" },
  ];

  const faqs = [
    { q: "料金はいくらですか？", a: "月額¥1,000（税込）のオールインクルーシブプランのみです。すべての機能がご利用いただけます。" },
    { q: "インボイス制度（適格請求書）に対応していますか？", a: "はい、登録番号（T番号）を設定することで、インボイス制度に対応した適格請求書を発行できます。" },
    { q: "データはどこに保存されますか？", a: "データは国内のセキュアなクラウドサーバーに暗号化して保存されます。第三者へのデータ提供は一切行いません。" },
    { q: "既存の会計ソフトと連携できますか？", a: "CSVエクスポートに対応しており、freee・弥生会計・マネーフォワードなど主要会計ソフトへのデータ移行が可能です。" },
    { q: "チームで使えますか？", a: "はい、1プランにつき最大5名まで招待できます。メンバーをメールで招待するだけで、請求書・取引先・経費データをチームで共有できます。管理者・メンバーのロール管理も可能です。" },
    { q: "途中で解約できますか？", a: "いつでも解約可能です。解約後もサブスクリプション期間終了までサービスをご利用いただけます。" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-black selection:text-white font-sans overflow-x-hidden">
      {/* ── navbar ── */}
      <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b border-black/5 bg-white/30 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-3 shrink-0 group cursor-pointer">
              <Image src="/logo.png" alt="Billia" width={36} height={36} className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform duration-300" />
              <span className="font-extrabold text-[22px] tracking-tighter text-black">Billia</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-[13px] font-bold tracking-tight text-black/50">
              <a href="#features" className="hover:text-black transition-colors duration-300">機能</a>
              <a href="#ai" className="hover:text-black transition-colors duration-300">AI アシスタント</a>
              <a href="#pricing" className="hover:text-black transition-colors duration-300">料金</a>
              <a href="#roadmap" className="hover:text-black transition-colors duration-300">開発ロードマップ</a>
              <a href="#crowdfunding" className="inline-flex items-center gap-2 hover:text-black transition-colors duration-300 group">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black/40 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
                </span>
                クラウドファンディング
                <span className="text-[9px] font-black text-white bg-black px-2 py-0.5 rounded-md shadow-md opacity-90 group-hover:scale-110 transition-transform">近日公開</span>
              </a>
            </nav>
            <div className="hidden md:block">
              <button className="h-11 px-6 rounded-xl bg-black text-white text-[13px] font-bold tracking-wide hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:bg-neutral-800 transition-all duration-300">
                ウェイティングリスト登録
              </button>
            </div>
            <button className="md:hidden p-2 text-black hover:bg-black/5 rounded-xl transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {/* Mobile menu handled below if needed, simplified for aesthetic */}
        {menuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full border-b border-black/5 bg-white/90 backdrop-blur-3xl px-6 py-6 space-y-4 shadow-2xl animate-in slide-in-from-top-2">
            <a href="#features" className="block text-base font-bold text-black/70 hover:text-black" onClick={() => setMenuOpen(false)}>機能</a>
            <a href="#ai" className="block text-base font-bold text-black/70 hover:text-black" onClick={() => setMenuOpen(false)}>AI アシスタント</a>
            <a href="#pricing" className="block text-base font-bold text-black/70 hover:text-black" onClick={() => setMenuOpen(false)}>料金</a>
            <a href="#roadmap" className="block text-base font-bold text-black/70 hover:text-black" onClick={() => setMenuOpen(false)}>開発ロードマップ</a>
          </div>
        )}
      </header>

      {/* ── hero ── */}
      <section className="relative w-full min-h-[100dvh] pt-20 flex items-center overflow-hidden">
        {/* Background Image: using next/image or fallback pattern */}
        <div className="absolute inset-0 -z-30">
          <Image 
            src="/hero-bg.jpg" 
            alt="Neo-futuristic white space"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Fallback color/gradient behind image just in case */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-neutral-200 -z-40" />
        </div>
        
        {/* Gradient overlays to ensure text readability even on bright white */}
        <div className="absolute inset-0 -z-20 bg-gradient-to-r from-white/90 via-white/50 to-transparent md:w-2/3" />
        <div className="absolute inset-0 -z-20 bg-gradient-to-t from-white via-transparent to-transparent opacity-80" />

        <div className="mx-auto max-w-7xl px-6 md:px-10 w-full relative z-10 py-12 lg:py-0">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-12">
            
            {/* Left Content */}
            <div className="w-full lg:w-1/2 pt-10 lg:pt-0">
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] fill-mode-both">
                <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 backdrop-blur-xl px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-black mb-8 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  次世代の自動化ツール
                </div>
              </div>
              
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] fill-mode-both">
                <h1 className="text-[42px] sm:text-5xl lg:text-[60px] xl:text-[72px] font-extrabold tracking-tight leading-[1.15] text-black mb-6 drop-shadow-sm">
                  経理を、もっと
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-black via-black/80 to-neutral-400">
                    シンプルに。
                  </span>
                </h1>
              </div>
              
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] fill-mode-both relative z-20">
                <p className="text-base md:text-lg text-black/60 font-medium leading-relaxed max-w-lg mb-10 backdrop-blur-xl bg-white/70 p-6 rounded-3xl border border-black/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] ring-1 ring-black/5">
                  面倒な入力作業はAIがスマートにアシスト。手入力に追われる日々は終わり、息を呑むほど美しいデザインであなたのビジネスを加速させます。
                </p>
              </div>
              
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] fill-mode-both flex flex-wrap items-center gap-4 relative z-20">
                <button className="h-14 px-8 rounded-2xl bg-black text-white font-bold tracking-widest hover:-translate-y-1 hover:bg-neutral-800 hover:shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-xl shadow-black/20">
                  無料で始める
                </button>
              </div>
            </div>

            {/* Right Mockups 3D Layering */}
            <div className="w-full lg:w-1/2 relative h-[500px] lg:h-[700px] flex items-center justify-center lg:perspective-[2000px] mt-10 lg:mt-0">
               {/* 3D layered glass mockups with strong shadow to separate them on mobile */}
               {/* Dashboard mockup (Back) */}
               <div className="absolute top-0 right-0 lg:-right-10 w-[95%] sm:w-[360px] transform lg:rotate-y-[-12deg] lg:rotate-x-[6deg] lg:translate-z-[-20px] transition-transform duration-1000 ease-out hover:rotate-0 hover:z-40 z-10 opacity-90 hover:opacity-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] rounded-3xl">
                 <DashboardMockup />
               </div>
               
               {/* Invoice mockup (Middle overlapping) */}
               <div className="absolute top-44 left-0 lg:-left-10 w-[90%] sm:w-[340px] transform lg:rotate-y-[8deg] lg:rotate-x-[4deg] lg:translate-z-[40px] transition-transform duration-1000 ease-out hover:rotate-0 hover:z-40 z-20 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] rounded-3xl">
                 <InvoiceListMockup />
               </div>

               {/* Analytics mockup (Front right bottom) */}
               <div className="absolute bottom-[-20px] lg:bottom-10 right-10 w-[85%] sm:w-[320px] transform lg:rotate-y-[-18deg] lg:rotate-x-[-8deg] lg:translate-z-[80px] transition-transform duration-1000 ease-out hover:rotate-0 hover:z-40 z-30 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] rounded-3xl">
                 <FinanceMockup />
               </div>

               {/* Ambient Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-tr from-white/0 via-white/50 to-white/0 blur-[100px] pointer-events-none -z-10" />
            </div>

          </div>
        </div>
      </section>

      {/* ── stats ── */}
      <section className="py-16 md:py-20 border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "月8時間", label: "の事務作業を削減", color: "text-blue-600" },
              { value: "99%", label: "のOCR読み取り精度", color: "text-emerald-600" },
              { value: "¥1,000", label: "月額・すべて込み", color: "text-indigo-600" },
              { value: "3分", label: "で請求書を作成", color: "text-cyan-600" },
            ].map((s) => (
              <div key={s.label}>
                <p className={`text-4xl md:text-5xl font-extrabold tracking-tighter tabular-nums mb-2 ${s.color}`}>{s.value}</p>
                <p className="text-sm text-black/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── crowdfunding ── */}
      <section id="crowdfunding" className="py-16 md:py-24 relative" ref={crowdfundingRef}>
        <div className="pointer-events-none absolute inset-x-0 -z-10 h-64 -translate-y-10 bg-gradient-to-b from-black/5 via-white to-transparent" />
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <div
            className={`relative group rounded-[2rem] border border-black/10 bg-gradient-to-br from-white/90 via-white/50 to-white/80 p-[1px] shadow-[0_18px_45px_rgba(0,0,0,0.05)] hover:shadow-[0_22px_70px_rgba(0,0,0,0.1)] transition-shadow duration-700 billia-fade-in-section overflow-visible ${crowdfundingInView ? "billia-fade-in-visible" : ""}`}
          >
            {/* outer glow */}
            <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-black/5 blur-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-1000" />
            <div className="pointer-events-none absolute -bottom-16 -left-6 w-52 h-52 rounded-full bg-black/5 blur-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-1000" />
            {/* inner card */}
            <div className="relative rounded-[2rem] bg-white/70 backdrop-blur-xl p-8 md:p-14 text-center overflow-hidden">
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-black text-white px-5 py-2 text-[10px] font-bold tracking-[0.2em] uppercase mb-8 shadow-xl shadow-black/10 group-hover:shadow-2xl group-hover:-translate-y-1 transition-all duration-500">
                  <Megaphone className="w-3.5 h-3.5 text-white" />
                  クラウドファンディング予告
                </div>
                
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-black mb-6 drop-shadow-sm break-keep">
                  共に創る、<br className="md:hidden" />新しい経理のカタチ。
                </h2>
                <p className="text-black/50 text-base md:text-lg font-medium leading-relaxed max-w-xl mx-auto mb-8 break-keep">
                  まもなくクラウドファンディングを開始します。<br />
                  初期支援者の皆様には、特別なプランをご用意しております。
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-black/5 bg-white px-5 py-2.5 shadow-sm group-hover:shadow-md transition-shadow duration-500">
                    <span className="font-extrabold text-black tracking-widest text-xs uppercase">Campfire</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse inline-block" />
                    限定公開中
                  </span>
                </div>
                <div className="flex justify-center mb-5">
                  <a
                    href="https://camp-fire.jp/projects/933297/preview?token=100zygut&utm_campaign=cp_po_share_c_msg_projects_show"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-black via-neutral-800 to-neutral-900 px-[2px] py-[2px] shadow-[0_12px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-all duration-500 group/button"
                  >
                    <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover/button:opacity-100 transition-opacity duration-500" />
                    <span className="relative flex items-center gap-2 rounded-[1rem] bg-black px-6 py-3 text-sm font-bold tracking-widest text-white">
                      開始前プレビューはこちら
                    </span>
                  </a>
                </div>
                <p className="mt-2 text-black/50 text-sm leading-relaxed max-w-xl mx-auto">
                  クラウドファンディングは近日公開予定<span className="whitespace-nowrap">です。</span>
                  <br />
                  支援者の皆さまには、リリース時にご利用いただける特別プランをご用意しています。
                </p>
                <p className="mt-3 text-black/50 text-sm md:text-base leading-relaxed">
                  ❤️ ページの
                  <a
                    href="https://camp-fire.jp/projects/933297/preview?token=100zygut&utm_campaign=cp_po_share_c_msg_projects_show"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black font-extrabold hover:underline decoration-2 underline-offset-4"
                  >
                    お気に入り登録
                  </a>
                  もお願い<span className="whitespace-nowrap">します！</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── feature grid ── */}
      <section id="features" className="py-20 md:py-28">
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
                <p className="text-xs text-black/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── document workflow ── */}
      <section className="py-20 md:py-28 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="text-center mb-14">
            <p className="billia-label mb-2">書類ワークフロー</p>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              見積から領収書まで、<br className="md:hidden" />全部Billiaで完結
            </h2>
            <p className="mt-4 text-black/50 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              4種類の書類がひとつにつながる。ワンクリックで変換、二重入力なし。
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-7 left-[14%] right-[14%] h-px bg-gradient-to-r from-indigo-200 via-blue-300 to-emerald-200" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { step: "01", label: "見積書", desc: "提案・有効期限付き", color: "border-indigo-200 bg-indigo-50 text-indigo-600", dot: "bg-indigo-400" },
                { step: "02", label: "請求書", desc: "ワンクリックで変換", color: "border-blue-200 bg-blue-50 text-blue-600", dot: "bg-blue-400" },
                { step: "03", label: "納品書", desc: "請求書から自動生成", color: "border-cyan-200 bg-cyan-50 text-cyan-600", dot: "bg-cyan-400" },
                { step: "04", label: "領収書", desc: "電帳法対応・自動採番", color: "border-emerald-200 bg-emerald-50 text-emerald-600", dot: "bg-emerald-400" },
              ].map(({ step, label, desc, color, dot }) => (
                <div key={step} className="flex flex-col items-center text-center">
                  <div className={`relative z-10 w-14 h-14 rounded-2xl border-2 flex items-center justify-center mb-4 font-bold text-lg ${color}`}>
                    {step}
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${dot} shadow`} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{label}</h3>
                  <p className="text-xs text-black/50">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 grid md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 md:p-8">
              <div className="inline-flex rounded-2xl bg-blue-50 p-3 mb-5">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">他社の書類もそのまま読み込める</h3>
              <p className="text-black/50 text-sm leading-relaxed mb-5">
                取引先から届いたPDFや画像をアップロードするだけ。AIが取引先・金額・明細を自動抽出してデータ入力を代行。複数ファイル同時対応でまとめて処理できます。
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["PDF", "JPEG / PNG", "Excel", "Word", "最大15枚同時"].map((t) => (
                  <span key={t} className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2 text-xs">
                {[
                  { name: "請求書_山田商事_3月.pdf", status: "✓ 完了", color: "text-emerald-700 bg-emerald-50" },
                  { name: "invoice_ABC_corp.pdf", status: "✓ 完了", color: "text-emerald-700 bg-emerald-50" },
                  { name: "見積書_3月分.xlsx", status: "解析中...", color: "text-blue-700 bg-blue-50" },
                ].map((f) => (
                  <div key={f.name} className="flex items-center justify-between bg-white rounded-lg border border-slate-100 px-3 py-2">
                    <span className="text-slate-600 truncate">{f.name}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${f.color}`}>{f.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-white p-7 md:p-8">
              <div className="inline-flex rounded-2xl bg-purple-100 p-3 mb-5">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">話しかけるだけで請求書ができる</h3>
              <p className="text-black/50 text-sm leading-relaxed mb-6">
                「山田商事に3月分50万、来月末払い」と話すだけ。AIが取引先・金額・支払期日を読み取り、即座に請求書を作成します。
              </p>
              {/* 音声入力UIモックアップ */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: "linear-gradient(90deg, #7c3aed, #2563eb)" }}>
                  <Mic className="w-3 h-3" />
                  音声入力にも対応
                </span>
                <span className="text-xs text-purple-400 font-medium">— 話すだけでOK</span>
              </div>
              <div className="rounded-2xl overflow-hidden relative mb-4" style={{ background: "linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 50%, #0a1628 100%)" }}>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full blur-3xl opacity-70" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.7) 0%, rgba(59,130,246,0.5) 40%, transparent 70%)" }} />
                </div>
                <div className="relative flex flex-col items-center py-6 px-6 gap-2">
                  <div className="w-14 h-14 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white font-semibold text-sm tracking-wide">聞いています...</p>
                  <p className="text-white/60 text-xs italic">"山田商事に3月分50万、来月末払いで"</p>
                </div>
              </div>
              {/* 生成結果 */}
              <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ 請求書を作成しました</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between"><span className="text-slate-400">取引先</span><span className="font-medium">山田商事</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">件名</span><span className="font-medium">3月分システム保守費</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">金額</span><span className="font-bold text-slate-900">¥500,000</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">支払期日</span><span className="font-medium">2025/04/30</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── こんな方に ── */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="text-center mb-12">
            <p className="billia-label mb-2">こんな方に</p>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              あらゆる事業者の<br className="md:hidden" />請求業務を効率化
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: Briefcase, title: "フリーランス", desc: "クライアントへの請求書発行から入金確認まで、ひとりでも迷わず管理。", tags: ["請求書作成", "入金確認", "経費管理"], color: "text-blue-500 bg-blue-50 border-blue-100" },
              { icon: Users, title: "小規模事業者", desc: "複数取引先の請求・支払・経費を一元管理。チームでのデータ共有も可能。", tags: ["複数取引先", "チーム共有", "財務サマリー"], color: "text-indigo-500 bg-indigo-50 border-indigo-100" },
              { icon: Building2, title: "不動産オーナー", desc: "入居者への家賃請求・入金消込を自動化。定期請求で毎月の作業をゼロに。", tags: ["定期請求", "入金消込", "入金管理"], color: "text-violet-500 bg-violet-50 border-violet-100" },
              { icon: Home, title: "副業・個人事業主", desc: "確定申告に必要な経費・売上データをかんたんに整理・エクスポート。", tags: ["経費記録", "CSVエクスポート", "インボイス対応"], color: "text-emerald-500 bg-emerald-50 border-emerald-100" },
            ].map((t) => {
              const [iconText, iconBg, borderColor] = t.color.split(" ");
              return (
                <div key={t.title} className={`rounded-2xl border bg-white p-6 hover:shadow-md transition-shadow ${borderColor}`}>
                  <div className={`inline-flex rounded-xl p-3 mb-4 ${iconText} ${iconBg}`}>
                    <t.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{t.title}</h3>
                  <p className="text-sm text-black/50 leading-relaxed mb-4">{t.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.tags.map((tag) => (
                      <span key={tag} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${iconBg} ${iconText}`}>{tag}</span>
                    ))}
                  </div>
                </div>
              );
            })}
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
            <p className="text-black/50 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
              3つのAI機能で、書類作成・データ入力のあらゆる手間を自動化します。
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-purple-100 bg-gradient-to-b from-purple-50 to-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex rounded-xl bg-purple-100 p-2.5"><Brain className="w-5 h-5 text-purple-600" /></div>
                <span className="inline-flex items-center gap-1 bg-purple-600 text-white rounded-full px-2.5 py-1 text-[11px] font-semibold">
                  <Mic className="w-3 h-3" />
                  音声入力対応
                </span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">メモ・音声から自動生成</h3>
              <p className="text-sm text-black/50 leading-relaxed mb-4">日本語で話しかけるか、テキストを入力するだけで請求書・見積書・経費を自動生成。取引先・金額・期日をAIが読み取ります。</p>
              <div className="rounded-lg bg-white border border-purple-100 px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Mic className="w-3 h-3 text-purple-400" />
                  <p className="text-[11px] text-slate-400 italic">話しかける or 入力</p>
                </div>
                <p className="text-xs text-slate-600">"山田商事に12月分 24万 請求、来月15日払い"</p>
              </div>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-6">
              <div className="inline-flex rounded-xl bg-blue-100 p-2.5 mb-4"><Upload className="w-5 h-5 text-blue-600" /></div>
              <h3 className="font-bold text-slate-900 mb-2">書類をそのままインポート</h3>
              <p className="text-sm text-black/50 leading-relaxed mb-4">請求書・見積書・領収書のPDFや画像をアップロードすると、OCRで取引先・金額・日付・明細を自動抽出してデータ登録。</p>
              <div className="flex flex-wrap gap-1.5">
                {["PDF","JPEG","PNG","HEIC","WebP"].map((f) => (
                  <span key={f} className="text-[10px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{f}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-6">
              <div className="inline-flex rounded-xl bg-emerald-100 p-2.5 mb-4"><BarChart3 className="w-5 h-5 text-emerald-600" /></div>
              <h3 className="font-bold text-slate-900 mb-2">経費を自動分類</h3>
              <p className="text-sm text-black/50 leading-relaxed mb-4">領収書のスキャンやメモ入力時に、通信費・外注費・旅費交通費などの経費カテゴリをAIが自動で判定して分類します。</p>
              <div className="flex flex-wrap gap-1.5">
                {["通信費","外注費","旅費交通費","消耗品"].map((c) => (
                  <span key={c} className="text-[10px] font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── before / after ── */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <div className="text-center mb-12">
            <p className="billia-label mb-2">Before / After</p>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">Billiaで、こう変わる</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-red-500" />
                </div>
                <span className="font-bold text-red-700">Before — 今まで</span>
              </div>
              <ul className="space-y-3">
                {[
                  "Excelで請求書を手動作成、毎月1時間以上かかる",
                  "入金確認は通帳を見て手動で照合",
                  "経費はレシートを手で入力、月末に大量入力",
                  "見積書→請求書への転記作業でミスが発生",
                  "支払期限を見落として取引先に迷惑",
                  "確定申告前に経費データを慌てて集計",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className="font-bold text-emerald-700">After — Billiaなら</span>
              </div>
              <ul className="space-y-3">
                {[
                  "メモを打つだけでAIが請求書を自動生成",
                  "CSVをアップロードするだけで入金消込が完了",
                  "領収書を撮影するだけで経費が自動登録・分類",
                  "見積書をワンクリックで請求書に変換",
                  "期限が近い請求書はダッシュボードで一目確認",
                  "チームメンバーと請求書・取引先データを共有",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── finance section ── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="max-w-xs mx-auto md:max-w-none md:order-1"><FinanceMockup /></div>
            <div className="md:order-2">
              <p className="billia-label mb-3">財務サマリー</p>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-5">
                売上・経費・未回収を<br />
                <span className="text-cyan-600">ひとつの画面で確認</span>
              </h2>
              <p className="text-black/50 leading-relaxed mb-6">今月の請求額・未入金・経費をダッシュボードにまとめて表示。払い忘れや未回収をすぐに把握できます。</p>
              <ul className="space-y-3">
                {["今月の請求額・未入金をひと目で確認","経費の月次合計を自動集計","支払期限が近い請求書をすぐ把握"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── team section ── */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <p className="billia-label mb-3">チーム管理</p>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-5">
                チームで使える、<br />
                <span className="text-blue-600">請求書管理</span>
              </h2>
              <p className="text-black/50 leading-relaxed mb-6">
                メンバーをメールで招待するだけ。招待されたユーザーは即座にチームの請求書・取引先・経費データにアクセスできます。個人アカウントとの切り替えもスムーズ。
              </p>
              <ul className="space-y-3">
                {[
                  "メールアドレスで簡単招待",
                  "管理者・メンバーのロール管理",
                  "請求書・取引先・経費をチームで共有",
                  "個人アカウントとの切り替えも可能",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="max-w-xs mx-auto md:max-w-sm">
              <TeamMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── mobile section ── */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="flex justify-center gap-4 md:gap-6">
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
                      {["請求書を作成","見積書を作成","経費を記録","入金消込"].map((a) => (
                        <div key={a} className="rounded bg-white border border-slate-100 px-1 py-1 text-center">
                          <p className="text-[7px] text-slate-600">{a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
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
                      { name: "株式会社ビリア", amount: "¥11,000", status: "支払済", sc: "bg-emerald-100 text-emerald-700" },
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
            <div>
              <p className="billia-label mb-3">モバイル対応</p>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-5">
                スマホでも、<br /><span className="text-blue-600">サクサク動く</span>
              </h2>
              <p className="text-black/50 leading-relaxed mb-6">PCだけではありません。Billiaはスマートフォンにも完全対応。外出先でも移動中でも、急な請求書の発行や入金確認がその場ですぐにできます。</p>
              <ul className="space-y-3">
                {["スマートフォンに最適化されたUI","外出先からでも請求書を即発行","入金確認・ステータス更新もモバイルから"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      
      {/* ── Roadmap ── */}
      <section id="roadmap" className="py-20 md:py-28 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <div className="text-center mb-12">
            <p className="billia-label mb-2">今後の開発ロードマップ</p>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
              Billiaは、もっと進化する。
            </h2>
            <p className="text-black/50 max-w-2xl mx-auto leading-relaxed">
              私たちは、単なる「ツール」で終わるつもりはありません。皆様のビジネス・事務作業の「当たり前」を根本から変えるための、今後の大型アップデート予定を公開します。
            </p>
          </div>
          
          <div className="relative">
            {/* Timeline Line (Desktop) */}
            <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-100 via-purple-100 to-transparent -translate-x-1/2" />
            
            <div className="space-y-8 md:space-y-12">
              {[
                {
                  phase: "Phase 1: LINE経理秘書（AIアシスタント）",
                  features: [
                    { t: "LINEで「話すだけ」請求書作成", d: "「山田商事にシステム保守費で50万請求」とLINEにメッセージや音声を送るだけで、請求書が完成します。" },
                    { t: "LINEで領収書を撮影・即登録", d: "移動中やカフェのレシートをスマホで撮ってLINEに投げるだけ。AIが自動で経費として分類・登録します。" },
                  ],
                  color: "emerald", align: "right"
                },
                {
                  phase: "Phase 2: 究極の放置化・共有",
                  features: [
                    { t: "Webスマート請求書（既読検知）", d: "PDFの手間をなくし、専用のWebリンクで請求。相手が開いた瞬間に「既読」がつくため、届いたかどうかの不安が消えます。" },
                    { t: "定期請求の完全オートパイロット", d: "家賃や顧問料など、毎月の決まった請求を一度設定すれば、一生自動で作成・送信され続けます。" },
                    { t: "Googleカレンダー連携", d: "月末にカレンダーの予定から『このMTGの請求書を作りますか？』とAIが先回りして提案します。" },
                  ],
                  color: "blue", align: "left"
                },
                {
                  phase: "Phase 3: 金融と生態系（構想）",
                  features: [
                    { t: "取引先専用マイページ", d: "取引先が過去の請求書をいつでも見られる専用ポータルを提供。メッセージのやり取りも一元化します。" },
                    { t: "Billia Pay（クレカ決済）", d: "請求書のWeb画面から、クレジットカード等のオンライン決済機能を利用できるようにします。" },
                    { t: "税理士アクセス・会計連携強化", d: "税理士を無料招待し、スムーズなデータチェックと確定申告のための完全なエクスポートを提供します。" },
                  ],
                  color: "purple", align: "right"
                }
              ].map((group, i) => (
                <div key={i} className={`relative flex flex-col md:flex-row gap-6 ${group.align === "left" ? "md:flex-row-reverse" : ""}`}>
                  {/* Timeline Dot */}
                  <div className="hidden md:flex absolute left-1/2 top-6 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-4 border-white shadow-sm items-center justify-center z-10">
                    <div className={`w-3 h-3 rounded-full bg-${group.color}-500`} />
                  </div>
                  
                  {/* Content Box */}
                  <div className="md:w-1/2 relative">
                    <div className={`md:${group.align === "left" ? "ml-12" : "mr-12"} p-6 md:p-8 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow`}>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-5 bg-${group.color}-50 text-${group.color}-600`}>
                        <Rocket className="w-3.5 h-3.5" />
                        {group.phase}
                      </div>
                      <ul className="space-y-5">
                        {group.features.map((f, j) => (
                          <li key={j}>
                            <h4 className="font-bold text-slate-900 mb-1 text-sm">{f.t}</h4>
                            <p className="text-black/50 text-xs leading-relaxed">{f.d}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Spacer for other side */}
                  <div className="hidden md:block md:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── pricing ── */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5 md:px-8 text-center">
          <p className="billia-label mb-3">料金</p>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-4">シンプルな料金体系</h2>
          <p className="text-black/50 mb-12 max-w-md mx-auto">すべての機能が使える、月額定額プランのみ。隠れた費用は一切なし。</p>
          <div className="max-w-sm mx-auto">
            <div className="rounded-3xl p-8 text-left relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #06b6d4 100%)" }}>
              <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }} />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white mb-6">
                  <Sparkles className="w-3 h-3" />All-inclusive Plan
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
                    "定期請求の自動化",
                    "チーム管理・最大5名まで招待",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-blue-50">
                      <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
                <div className="flex justify-center"><ComingSoonBadge size="md" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── how it works ── */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="mx-auto max-w-4xl px-5 md:px-8 text-center">
          <p className="billia-label mb-3">使い方</p>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-12">3ステップで始められる</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: ShieldCheck, title: "アカウント作成", desc: "メールアドレスだけで登録。すぐに使い始められます。", color: "text-blue-500 bg-blue-50" },
              { step: "02", icon: Upload, title: "書類をインポート", desc: "請求書・見積書・領収書をアップロード。AIが自動でデータを抽出します。", color: "text-purple-500 bg-purple-50" },
              { step: "03", icon: Zap, title: "業務を自動化", desc: "ステータス管理・入金確認・経費登録がすべてひとつの場所で完結。", color: "text-cyan-500 bg-cyan-50" },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="text-4xl font-black text-slate-100 mb-3">{s.step}</div>
                <div className={`inline-flex rounded-2xl p-3 mb-4 ${s.color}`}><s.icon className="w-6 h-6" /></div>
                <h3 className="font-bold text-base text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-black/50 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <div className="text-center mb-12">
            <p className="billia-label mb-3">FAQ</p>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">よくある質問</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-sm text-slate-900 pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-black/50 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── waitlist CTA ── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="rounded-3xl p-10 md:p-16 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #06b6d4 100%)" }}>
            <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }} />
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #a5f3fc 0%, transparent 70%)" }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white mb-6">
                <Star className="w-3.5 h-3.5" />リリース通知を受け取る
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">もうすぐリリース</h2>
              <p className="text-blue-100 mb-8 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                メールアドレスを登録しておくと、リリース時に真っ先にお知らせします。
                月額¥1,000で、AIを活用した請求業務の自動化を体験してください。
              </p>
              {submitted ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 border border-white/30 px-6 py-3 text-white font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-cyan-300" />
                  登録しました！リリース時にお知らせします
                </div>
              ) : (
                <form
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const value = email.trim();
                    if (!value) return;
                    setWaitlistError(null);
                    setWaitlistLoading(true);
                    try {
                      const url = process.env.NEXT_PUBLIC_WAITLIST_WEBHOOK_URL;
                      if (url) {
                        const res = await fetch(url, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: value }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok || !(data && (data as { ok?: boolean }).ok)) {
                          setWaitlistError("送信に失敗しました。しばらくして再度お試しください。");
                          return;
                        }
                      }
                      setSubmitted(true);
                    } catch {
                      setWaitlistError("送信に失敗しました。しばらくして再度お試しください。");
                    } finally {
                      setWaitlistLoading(false);
                    }
                  }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setWaitlistError(null); }}
                    placeholder="メールアドレスを入力"
                    required
                    disabled={waitlistLoading}
                    className="flex-1 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-70"
                  />
                  <button
                    type="submit"
                    disabled={waitlistLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors shrink-0 disabled:opacity-70"
                  >
                    {waitlistLoading ? "送信中…" : "通知を受け取る"}
                    {!waitlistLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              )}
              {waitlistLoading === false && waitlistError && (
                <p className="mt-3 text-sm text-red-200">{waitlistError}</p>
              )}
            </div>
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
              <a href="#faq" className="hover:text-slate-600 transition-colors">FAQ</a>
            </div>
            <p className="text-xs text-slate-400">© 2026 Billia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
