"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // フェードイン開始
    setIsVisible(true);

    // 2.5秒後にフェードアウト開始
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2500);

    // 3秒後にリダイレクト
    const redirectTimer = setTimeout(() => {
      if (isSignedIn) {
        router.push("/dashboard");
      } else {
        router.push("/sign-in");
      }
    }, 3000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(redirectTimer);
    };
  }, [router, isSignedIn]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div
        className={`flex flex-col items-center justify-center transition-all duration-1000 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        } ${isFadingOut ? "opacity-0 scale-110" : ""}`}
      >
        {/* ロゴアイコン */}
        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-billio-blue to-billio-green flex items-center justify-center mb-6">
          <Sparkles className="h-12 w-12 text-white" />
        </div>
        
        {/* ロゴテキスト */}
        <h1 className="text-6xl font-bold text-white tracking-wider">
          Billio
        </h1>
      </div>
    </div>
  );
}
