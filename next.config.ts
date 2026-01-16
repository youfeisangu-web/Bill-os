import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScriptのエラーのみ無視する（これはVercelでも有効）
  typescript: {
    ignoreBuildErrors: true,
  },
  // eslintの設定は削除する（Vercelの設定画面で無視設定を入れるため、ここでは書かない）
};

export default nextConfig;
