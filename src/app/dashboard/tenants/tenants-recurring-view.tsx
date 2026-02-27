"use client";

import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TenantsClientView from "./tenants-client-view";
import RecurringClientView from "../recurring/recurring-client-view";
import { DollarSign, Calendar } from "lucide-react";

type Props = {
  defaultTab?: string;
  tenantsProps: React.ComponentProps<typeof TenantsClientView>;
  recurringProps: React.ComponentProps<typeof RecurringClientView>;
};

export default function TenantsRecurringView({
  defaultTab,
  tenantsProps,
  recurringProps,
}: Props) {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab = tabFromUrl === "templates" ? "templates" : tabFromUrl === "tenants" ? "tenants" : defaultTab ?? "tenants";

  return (
    <Tabs defaultValue={initialTab} className="w-full">
      <div className="px-6 pt-6 pb-2">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="tenants" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <DollarSign className="w-4 h-4" />
            取引先・入金
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Calendar className="w-4 h-4" />
            請求テンプレート
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="tenants" className="mt-0">
        <TenantsClientView {...tenantsProps} />
      </TabsContent>
      <TabsContent value="templates" className="mt-0">
        <RecurringClientView {...recurringProps} />
      </TabsContent>
    </Tabs>
  );
}
