"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // ライトモードを強制 - forcedThemeがpropsで指定されていない場合でも確実にライトモードを維持
  const themeProps = {
    ...props,
    forcedTheme: props.forcedTheme || "light",
    enableSystem: false,
  };
  
  return <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>;
}
