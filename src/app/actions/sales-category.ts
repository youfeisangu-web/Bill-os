"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/gemini";

export type SubmitResult = { success: boolean; message?: string };

/** 売上カテゴリ一覧取得 */
export async function getSalesCategories() {
  const { userId } = await auth();
  if (!userId) return [];

  const list = await prisma.salesCategory.findMany({
    where: { userId },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { entries: true } } },
  });
  return list;
}

/** 売上カテゴリ追加 */
export async function createSalesCategory(formData: FormData): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, message: "認証が必要です" };

    const name = (formData.get("name") as string)?.trim();
    if (!name) return { success: false, message: "カテゴリ名を入力してください" };

    const maxOrder = await prisma.salesCategory.aggregate({
      where: { userId },
      _max: { displayOrder: true },
    });
    const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    await prisma.salesCategory.create({
      data: { userId, name, displayOrder },
    });
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: any) {
    if (e?.code === "P2002") return { success: false, message: "同じ名前のカテゴリが既にあります" };
    return { success: false, message: e?.message ?? "登録に失敗しました" };
  }
}

/** 売上カテゴリ削除 */
export async function deleteSalesCategory(id: string): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, message: "認証が必要です" };

    await prisma.salesCategory.deleteMany({
      where: { id, userId },
    });
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e?.message ?? "削除に失敗しました" };
  }
}

/** 指定月のカテゴリ別売上取得 */
export async function getCategorySalesByMonth(month: string) {
  const { userId } = await auth();
  if (!userId) return { categories: [], entries: [] };

  const [categories, entries] = await Promise.all([
    prisma.salesCategory.findMany({
      where: { userId },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.categorySalesEntry.findMany({
      where: { userId, month },
      include: { category: true },
    }),
  ]);

  return { categories, entries };
}

/** カテゴリ別売上を一括保存（手入力用） */
export async function upsertCategorySales(
  month: string,
  updates: Array<{ categoryId: string; amount: number }>
): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, message: "認証が必要です" };

    for (const { categoryId, amount } of updates) {
      await prisma.categorySalesEntry.upsert({
        where: {
          userId_categoryId_month: { userId, categoryId, month },
        },
        create: { userId, categoryId, month, amount },
        update: { amount },
      });
    }
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e?.message ?? "保存に失敗しました" };
  }
}

/** 月別売上サマリ（グラフ用） */
export async function getMonthlySalesSummary(monthsBack: number = 12) {
  const { userId } = await auth();
  if (!userId) return [];

  const now = new Date();
  const months: string[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const entries = await prisma.categorySalesEntry.findMany({
    where: { userId, month: { in: months } },
  });

  const byMonth: Record<string, number> = {};
  months.forEach((m) => (byMonth[m] = 0));
  entries.forEach((e) => {
    byMonth[e.month] = (byMonth[e.month] ?? 0) + e.amount;
  });

  return months.map((month) => ({
    month,
    total: byMonth[month] ?? 0,
  }));
}

/** 請求書をAIでカテゴリに振り分けし、該当月のカテゴリ別売上に加算する */
export async function categorizeInvoiceWithAI(invoiceId: string): Promise<SubmitResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, message: "認証が必要です" };

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return { success: false, message: "Gemini APIキーが設定されていません" };

    const [invoice, categories] = await Promise.all([
      prisma.invoice.findFirst({
        where: { id: invoiceId, userId },
        include: { items: true },
      }),
      prisma.salesCategory.findMany({
        where: { userId },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      }),
    ]);

    if (!invoice) return { success: false, message: "請求書が見つかりません" };
    if (!categories.length) return { success: false, message: "先に売上分析でカテゴリを追加してください" };
    if (!invoice.items.length) return { success: false, message: "請求書に明細がありません" };

    const categoryNames = categories.map((c) => c.name);
    const items = invoice.items.map((item, i) => ({
      index: i,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
    }));

    const prompt = `以下の請求書明細を、指定されたカテゴリのいずれか1つに振り分けてください。
カテゴリは必ず次のいずれかと完全に一致させてください（表記を変えないでください）: ${categoryNames.join("、")}

明細:
${items.map((x) => `[${x.index}] ${x.name} 数量${x.quantity} 単価${x.unitPrice}円 → 金額${x.amount}円`).join("\n")}

JSON形式のみで返してください（説明やMarkdownは不要）:
{ "assignments": [ { "itemIndex": 0, "categoryName": "カテゴリ名" }, ... ] }
各明細に1つだけカテゴリを割り当て、categoryNameは上記カテゴリのいずれかと完全一致させてください。`;

    const raw = await generateText(prompt, { maxTokens: 1000 });
    const jsonMatch = raw.replace(/```\w*\n?/g, "").trim().match(/\{[\s\S]*\}/);
    const json = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
    const assignments: Array<{ itemIndex: number; categoryName: string }> = json.assignments ?? [];

    const categoryIds = new Map(categories.map((c) => [c.name, c.id]));
    const sums: Record<string, number> = {};
    for (const a of assignments) {
      const item = items.find((x) => x.index === a.itemIndex);
      const catId = categoryIds.get(a.categoryName);
      if (!item || !catId) continue;
      sums[catId] = (sums[catId] ?? 0) + item.amount;
    }

    const month =
      `${invoice.issueDate.getFullYear()}-${String(invoice.issueDate.getMonth() + 1).padStart(2, "0")}`;

    for (const [categoryId, addAmount] of Object.entries(sums)) {
      if (addAmount <= 0) continue;
      const existing = await prisma.categorySalesEntry.findUnique({
        where: { userId_categoryId_month: { userId, categoryId, month } },
      });
      const newAmount = (existing?.amount ?? 0) + addAmount;
      await prisma.categorySalesEntry.upsert({
        where: { userId_categoryId_month: { userId, categoryId, month } },
        create: { userId, categoryId, month, amount: newAmount },
        update: { amount: newAmount },
      });
    }

    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard");
    return { success: true, message: `${month}のカテゴリ別売上に反映しました` };
  } catch (e: any) {
    return { success: false, message: e?.message ?? "AI振り分けに失敗しました" };
  }
}
