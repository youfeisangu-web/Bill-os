import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getExpenses } from "@/app/actions/expense";
import ExpensesEntry from "./expenses-entry";
import ExpensesList from "./expenses-list";

export default async function ExpensesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const expenses = await getExpenses();

  return (
    <div className="py-5 md:py-8 space-y-5 pb-12">
      <header className="flex flex-col gap-1">
        <p className="billia-label">経費</p>
        <h1 className="text-xl font-semibold tracking-tight text-billia-text md:text-2xl">
          経費管理
        </h1>
        <p className="text-xs text-billia-text-muted hidden md:block">
          領収書スキャン・メモ入力・手動で経費を記録できます。
        </p>
      </header>

      {/* 登録セクション */}
      <section>
        <p className="billia-label mb-2">経費を追加</p>
        <ExpensesEntry />
      </section>

      {/* 一覧セクション */}
      <section>
        <p className="billia-label mb-2">経費一覧</p>
        <ExpensesList initialExpenses={expenses} />
      </section>
    </div>
  );
}
