import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getRecurringTemplates } from "@/app/actions/recurring";
import RecurringClientView from "./recurring-client-view";

export default async function RecurringPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const templates = await getRecurringTemplates();

  return <RecurringClientView templates={templates} />;
}
