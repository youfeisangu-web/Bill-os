import { redirect } from "next/navigation";

export default function RecurringPage() {
  redirect("/dashboard/tenants?tab=templates");
}
