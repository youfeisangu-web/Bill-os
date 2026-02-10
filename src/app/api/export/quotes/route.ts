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

  const quotes = await prisma.quote.findMany({
    where: { userId },
    orderBy: { issueDate: "desc" },
    include: { client: { select: { name: true } } },
  });

  const header = [
    "見積番号",
    "取引先",
    "発行日",
    "有効期限",
    "合計金額",
    "ステータス",
  ];
  const rows = quotes.map((q) => [
    q.quoteNumber,
    q.client?.name ?? "",
    q.issueDate.toISOString().slice(0, 10),
    q.validUntil.toISOString().slice(0, 10),
    q.totalAmount,
    q.status,
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
      "Content-Disposition": `attachment; filename="quotes-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
