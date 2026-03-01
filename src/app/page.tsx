"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [phase, setPhase] = useState<"enter" | "shine" | "exit">("enter");

  // アニメーションは常に即座に開始（Clerkの状態に依存しない）
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("shine"), 700);
    const t2 = setTimeout(() => setPhase("exit"), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // リダイレクトはClerkの読み込み完了後のみ実行
  useEffect(() => {
    if (!isLoaded) return;
    const t3 = setTimeout(() => {
      router.push(isSignedIn ? "/dashboard" : "/sign-in");
    }, 2700);
    return () => clearTimeout(t3);
  }, [router, isSignedIn, isLoaded]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#080808" }}
    >
      <style>{`
        @keyframes logoEnter {
          0%   { transform: scale(1.6); opacity: 0; filter: blur(12px); }
          50%  { opacity: 1; filter: blur(0px); }
          100% { transform: scale(1); opacity: 1; filter: blur(0px); }
        }
        @keyframes logoExit {
          0%   { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes shineSwipe {
          0%   { left: -60%; }
          100% { left: 120%; }
        }
        .logo-wrap {
          animation: logoEnter 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .logo-wrap.exiting {
          animation: logoExit 0.65s cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }
        .shine {
          position: fixed;
          top: 0; bottom: 0;
          left: -60%;
          width: 60%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.12) 50%,
            transparent 100%
          );
          filter: blur(20px);
          animation: shineSwipe 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          pointer-events: none;
        }
      `}</style>

      {/* 画面全体のシャインエフェクト */}
      {phase === "shine" && <div className="shine" />}

      <div
        className={`relative logo-wrap${phase === "exit" ? " exiting" : ""}`}
        style={{ width: 220, height: 220 }}
      >
        <Image
          src="/logo.png"
          alt="Billia"
          width={220}
          height={220}
          className="object-contain w-full h-full"
          priority
        />
      </div>
    </div>
  );
}
