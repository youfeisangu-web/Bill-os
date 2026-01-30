"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function useNavigation() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  useEffect(() => {
    // パス名が変更されたら、ナビゲーションが完了したとみなす
    setIsNavigating(false);
    setLoadingPath(null);
  }, [pathname]);

  const startNavigation = (path: string) => {
    setIsNavigating(true);
    setLoadingPath(path);
  };

  return {
    isNavigating,
    loadingPath,
    startNavigation,
  };
}
