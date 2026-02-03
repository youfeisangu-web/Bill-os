import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getReconcileSummary } from "@/app/actions/payment";
import ReconcileClient from "./reconcile-client";

export default async function ReconcilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const summary = await getReconcileSummary();

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-slate-900">入金消し込み</h1>
        <p className="text-sm text-slate-600 mt-1">
          入金明細（CSV、通帳の写真、入金通知書のPDFなど）を読み込んで消し込みを行います。AIが自動で入金情報を抽出し、内容を確認してから消し込みを実行してください。（賃貸以外の請求・入金にも利用できます）
        </p>
      </header>
      <main className="flex-1 overflow-y-auto">
        <ReconcileClient initialSummary={summary} />
      </main>
    </div>
  );
}
