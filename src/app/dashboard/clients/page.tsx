import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import NewClientDialog from "./new-client-dialog";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(date);

export default async function ClientsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const clients = await prisma.client.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
            取引先
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">取引先一覧</h1>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          請求書の送付先となる取引先を管理できます。
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              登録済み取引先
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              会社名、メールアドレス、住所を一覧で確認できます。
            </p>
          </div>
          <NewClientDialog />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">会社名 / 氏名</th>
                <th className="px-4 py-3">メールアドレス</th>
                <th className="px-4 py-3">住所</th>
                <th className="px-4 py-3">登録日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    まだ取引先が登録されていません。新規作成から追加してください。
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="text-slate-700 dark:text-slate-300">
                    <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-50">
                      {client.name}
                    </td>
                    <td className="px-4 py-4 dark:text-slate-400">{client.email ?? "-"}</td>
                    <td className="px-4 py-4 dark:text-slate-400">{client.address ?? "-"}</td>
                    <td className="px-4 py-4 dark:text-slate-400">
                      {formatDate(client.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
