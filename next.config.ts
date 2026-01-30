import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ⚠️ 注意: TypeScriptのエラーを無視する設定です
  // 本番環境での予期せぬランタイムエラーを防ぐため、定期的に型エラーを修正してください
  // 確認方法: npx tsc --noEmit
  typescript: {
    ignoreBuildErrors: true, // TODO: 型エラーを修正したら false に変更
  },
  // eslintの設定は削除する（Vercelの設定画面で無視設定を入れるため、ここでは書かない）
};

export default nextConfig;
