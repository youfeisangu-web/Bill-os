import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { jaJP } from "@clerk/localizations";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin", "japanese"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bill OS | 企業向け次世代クラウド請求管理プラットフォーム",
  description:
    "Bill OSは、組織の請求業務を統合管理するクラウドERPです。インボイス制度・電帳法に完全対応。承認フローの標準化、ガバナンス強化、経理DXを強力に推進します。",
  keywords: [
    "請求管理システム",
    "クラウドERP",
    "経理DX",
    "インボイス制度対応",
    "電子帳簿保存法",
    "B2B",
    "SaaS",
    "予実管理",
    "コスト削減",
    "請求業務効率化",
    "ガバナンス強化",
    "承認フロー",
    "経理システム",
  ],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://bill-os.com",
    siteName: "Bill OS",
    title: "Bill OS | 企業向け次世代クラウド請求管理プラットフォーム",
    description:
      "組織の請求業務を統合管理するクラウドERP。インボイス制度・電帳法に完全対応。承認フロー標準化、ガバナンス強化、経理DXを推進。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Bill OS - 企業向けクラウド請求管理プラットフォーム",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bill OS | 企業向け次世代クラウド請求管理プラットフォーム",
    description:
      "組織の請求業務を統合管理するクラウドERP。インボイス制度・電帳法に完全対応。承認フロー標準化、ガバナンス強化、経理DXを推進。",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://bill-os.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={jaJP}>
      <html lang="ja" suppressHydrationWarning>
        <body
          className={`${inter.variable} ${notoSansJp.variable} font-sans`}
        >
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
