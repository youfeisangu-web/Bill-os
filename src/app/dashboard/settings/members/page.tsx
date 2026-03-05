import { auth } from "@clerk/nextjs/server";
import { OrganizationProfile } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function MembersPage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/");

  if (!orgId) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <header>
          <p className="billia-label">メンバー管理</p>
          <h1 className="text-2xl font-semibold tracking-tight text-billia-text">チーム管理</h1>
        </header>
        <div className="rounded-2xl border border-billia-border-subtle bg-white p-8 text-center">
          <p className="text-billia-text-muted mb-4">
            チームを作成すると、複数人で請求書・取引先などのデータを共有できます。
          </p>
          <p className="text-sm text-billia-text-muted">
            ヘッダー右上の組織切り替えから「組織を作成」してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <header>
        <p className="billia-label">メンバー管理</p>
        <h1 className="text-2xl font-semibold tracking-tight text-billia-text">チーム管理</h1>
        <p className="text-sm text-billia-text-muted mt-1">
          メンバーの招待・削除・ロール変更ができます。
        </p>
      </header>
      <OrganizationProfile
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border border-billia-border-subtle rounded-2xl",
          },
        }}
      />
    </div>
  );
}
