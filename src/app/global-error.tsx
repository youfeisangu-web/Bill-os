"use client";

import { useEffect } from "react";
import { translateErrorMessage } from "@/lib/error-translator";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをログに記録（本番環境では外部サービスに送信）
    console.error("Global application error:", error);
  }, [error]);

  const japaneseMessage = translateErrorMessage(error.message);

  return (
    <html lang="ja">
      <body className="antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
          <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="rounded-full bg-red-100 p-4">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-slate-900">
                  重大なエラーが発生しました
                </h1>
                <p className="text-sm text-slate-600">
                  アプリケーション全体で予期しないエラーが発生しました。
                  <br />
                  ページを再読み込みして再度お試しください。
                </p>
              </div>
              <div className="w-full rounded-lg bg-slate-100 p-4 text-left">
                <p className="text-sm text-slate-700 font-medium mb-2">エラー詳細:</p>
                <p className="text-xs text-slate-600 whitespace-pre-wrap">
                  {japaneseMessage}
                </p>
                {process.env.NODE_ENV === "development" && (
                  <details className="mt-2">
                    <summary className="text-xs text-slate-500 cursor-pointer">技術詳細（開発用）</summary>
                    <p className="text-xs font-mono text-slate-500 mt-1 break-all">
                      {error.message}
                    </p>
                    {error.stack && (
                      <pre className="mt-2 max-h-40 overflow-auto text-xs text-slate-500">
                        {error.stack}
                      </pre>
                    )}
                  </details>
                )}
              </div>
              <div className="flex w-full gap-3 pt-4">
                <button
                  onClick={reset}
                  className="flex-1 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  再読み込み
                </button>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="flex-1 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  トップページに戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
