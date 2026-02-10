import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { issueDate: "desc" },
    include: { client: { select: { name: true } } },
  });

  const header = [
    "請求書番号",
    "取引先",
    "発行日",
    "支払期限",
    "合計金額",
    "ステータス",
  ];
  const rows = invoices.map((inv) => [
    inv.id,
    inv.client?.name ?? "",
    inv.issueDate.toISOString().slice(0, 10),
    inv.dueDate.toISOString().slice(0, 10),
    inv.totalAmount,
    inv.status,
  ]);

  const csv =
    "\uFEFF" +
    [header.join(","), ...rows.map((r) => r.map(escapeCsvCell).join(","))].join(
      "\r\n",
    );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoices-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
