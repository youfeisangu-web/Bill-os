import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getMonthlyFinancials,
  getExpensesByCategory,
  getTopClients,
  getUpcomingPayments,
  getFinanceKPI,
} from "@/app/actions/finance";
import FinanceClientView from "./finance-client-view";

export default async function FinancePage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const [monthly, categories, topClients, upcoming, kpi] = await Promise.all([
    getMonthlyFinancials(60),
    getExpensesByCategory(),
    getTopClients(5),
    getUpcomingPayments(),
    getFinanceKPI(),
  ]);

  return (
    <FinanceClientView
      monthly={monthly}
      categories={categories}
      topClients={topClients}
      upcoming={upcoming}
      kpi={kpi}
    />
  );
}
