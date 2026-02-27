"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2500);

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
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div
        className={`flex flex-col items-center justify-center transition-all duration-1000 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        } ${isFadingOut ? "opacity-0 scale-110" : ""}`}
      >
        {/* ロゴアイコン */}
        <div className="w-32 h-32 flex items-center justify-center mb-6" style={{ background: 'transparent' }}>
          <img
            src="/logo.png"
            alt="Billia"
            className="w-full h-full object-contain"
            style={{ background: 'transparent', mixBlendMode: 'normal' }}
          />
        </div>

        {/* ロゴテキスト */}
        <h1 className="text-5xl font-semibold text-billia-text tracking-tight">
          Billia
        </h1>
      </div>
    </div>
  );
}
