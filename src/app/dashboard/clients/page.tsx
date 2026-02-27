import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import NewClientDialog from "./new-client-dialog";
import EditClientDialog from "./edit-client-dialog";
import DeleteClientButton from "./delete-client-button";

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
    <div className="flex flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <p className="billia-label">取引先</p>
        <h1 className="text-2xl font-semibold tracking-tight text-billia-text">
          取引先一覧
        </h1>
        <p className="text-sm text-billia-text-muted mt-1">
          請求書の送付先となる取引先を管理できます。
        </p>
      </header>

      <section className="billia-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="billia-label mb-1">登録済み取引先</p>
            <p className="text-sm text-billia-text-muted">
              会社名、メールアドレス、住所を一覧で確認できます。
            </p>
          </div>
          <NewClientDialog />
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-billia-border-subtle">
          <table className="w-full text-left text-sm">
            <thead className="bg-billia-bg billia-label">
              <tr>
                <th className="px-4 py-3">会社名 / 氏名</th>
                <th className="px-4 py-3">メールアドレス</th>
                <th className="px-4 py-3">住所</th>
                <th className="px-4 py-3">登録日</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-billia-border-subtle">
              {clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-billia-text-muted"
                  >
                    まだ取引先が登録されていません。新規作成から追加してください。
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="text-billia-text-muted">
                    <td className="px-4 py-4 font-medium text-billia-text">
                      {client.name}
                    </td>
                    <td className="px-4 py-4">{client.email ?? "-"}</td>
                    <td className="px-4 py-4">{client.address ?? "-"}</td>
                    <td className="px-4 py-4">
                      {formatDate(client.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <EditClientDialog client={client} />
                        <DeleteClientButton clientId={client.id} clientName={client.name} />
                      </div>
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
