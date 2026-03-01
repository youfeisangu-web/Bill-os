import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBills } from "@/app/actions/bill";
import BillsClientView from "./bills-client-view";

export default async function BillsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const bills = await getBills();

  return <BillsClientView initialBills={bills} />;
}
