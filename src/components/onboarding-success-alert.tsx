"use client";

import { useEffect } from "react";

export default function OnboardingSuccessAlert() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const flag = window.sessionStorage.getItem("onboardingSaved");
    if (flag) {
      window.sessionStorage.removeItem("onboardingSaved");
      window.alert("設定を保存しました");
    }
  }, []);

  return null;
}
