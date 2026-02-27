"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [phase, setPhase] = useState<"enter" | "shine" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("shine"), 700);
    const t2 = setTimeout(() => setPhase("exit"), 2000);
    const t3 = setTimeout(() => {
      if (isSignedIn) {
        router.push("/dashboard");
      } else {
        router.push("/sign-in");
      }
    }, 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [router, isSignedIn]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
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
          100% { transform: scale(0.9); opacity: 0; }
        }
        @keyframes shineSwipe {
          0%   { left: -80%; }
          100% { left: 160%; }
        }
        .logo-wrap {
          animation: logoEnter 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .logo-wrap.exiting {
          animation: logoExit 0.55s cubic-bezier(0.55, 0, 1, 0.45) forwards;
        }
        .shine {
          position: absolute;
          top: 0; bottom: 0;
          width: 55%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.18) 50%,
            transparent 100%
          );
          filter: blur(10px);
          animation: shineSwipe 0.65s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          pointer-events: none;
        }
      `}</style>

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

        {/* シャインエフェクト */}
        {phase === "shine" && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="shine" />
          </div>
        )}
      </div>
    </div>
  );
}
