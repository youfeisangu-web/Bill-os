"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import LoadingSpinner from "./loading-spinner";

export default function NavigationLoader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const prevPathnameRef = useRef(pathname);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // パス名が変更された場合（ページ遷移完了）
    if (pathname !== prevPathnameRef.current) {
      // ローディングを非表示にする
      setIsLoading(false);
      prevPathnameRef.current = pathname;
      
      // タイマーをクリア
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, [pathname]);

  // ページ遷移の開始を検知（リンククリック時）
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      
      if (link && link.href && !link.href.startsWith("#") && !link.hasAttribute("download")) {
        try {
          const url = new URL(link.href);
          const currentUrl = new URL(window.location.href);
          
          // 同じオリジン内のリンクで、パスが異なる場合のみローディングを表示
          if (
            url.origin === currentUrl.origin && 
            url.pathname !== currentUrl.pathname &&
            url.pathname !== pathname
          ) {
            // 即座にローディングを表示
            setIsLoading(true);
            
            // タイマーをクリア
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
            }
            
            // 遷移が遅い場合に備えて、一定時間後にローディングを表示
            loadingTimeoutRef.current = setTimeout(() => {
              // パス名がまだ変更されていない場合、ローディングを表示し続ける
              if (url.pathname !== pathname) {
                setIsLoading(true);
              }
            }, 150);
          }
        } catch (error) {
          // URL解析エラーは無視
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <LoadingSpinner size="lg" text="読み込み中..." />
      </div>
    </div>
  );
}
