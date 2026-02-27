import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTenantGroups } from "@/app/actions/tenant-group";
import { getTenantsByGroup } from "@/app/actions/tenant";
import { getPaymentStatusesByGroup } from "@/app/actions/payment-status";
import {
  getRecurringTemplates,
  getRecurringGeneratedInvoicesThisMonth,
} from "@/app/actions/recurring";
import TenantsRecurringView from "./tenants-recurring-view";

type Props = {
  searchParams: Promise<{ groupId?: string; tab?: string }>;
};

export default async function TenantsPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const params = await searchParams;
  const selectedGroupId = params.groupId || null;
  const tab = params.tab || undefined;

  const [
    groups,
    tenants,
    currentMonthStatuses,
    templates,
    generatedInvoices,
  ] = await Promise.all([
    getTenantGroups(),
    getTenantsByGroup(selectedGroupId),
    getPaymentStatusesByGroup(selectedGroupId),
    getRecurringTemplates(),
    getRecurringGeneratedInvoicesThisMonth(),
  ]);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const filteredCurrentMonth = currentMonthStatuses.filter(
    (ps) => ps.targetMonth === currentMonth
  );

  const collectedAmount = filteredCurrentMonth
    .filter((ps) => ps.status === "PAID" || ps.status === "PARTIAL")
    .reduce((sum, ps) => sum + ps.paidAmount, 0);

  const unpaidAmount = filteredCurrentMonth
    .filter((ps) => ps.status === "UNPAID" || ps.status === "PARTIAL")
    .reduce((sum, ps) => sum + (ps.expectedAmount - ps.paidAmount), 0);

  const overdueCount = currentMonthStatuses.filter((ps) => {
    const [year, month] = ps.targetMonth.split("-").map(Number);
    const targetMonthEnd = new Date(year, month, 0);
    return (
      targetMonthEnd < now &&
      (ps.status === "UNPAID" || ps.status === "PARTIAL")
    );
  }).length;

  return (
    <TenantsRecurringView
      defaultTab={tab === "templates" ? "templates" : "tenants"}
      tenantsProps={{
        groups,
        tenants,
        selectedGroupId,
        currentMonth,
        collectedAmount,
        unpaidAmount,
        overdueCount,
      }}
      recurringProps={{
        templates,
        generatedInvoices,
      }}
    />
  );
}
