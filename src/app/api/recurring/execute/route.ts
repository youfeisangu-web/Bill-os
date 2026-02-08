import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createInvoice } from "@/app/actions/invoice";
import { calcTaxAmount, type TaxRounding } from "@/lib/utils";

/**
 * 定期請求の自動実行API
 * Vercel Cron Jobsから呼び出される
 * 
 * 毎日1回実行され、nextExecutionDateが今日のテンプレートを処理する
 */
export async function POST(request: NextRequest) {
  try {
    // セキュリティ: リクエストヘッダーで認証（Vercel Cron Jobsの場合はAuthorizationヘッダーを設定）
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 今日が実行日のテンプレートを取得（有効なもののみ）
    const templates = await prisma.recurringTemplate.findMany({
      where: {
        isActive: true,
        nextExecutionDate: {
          lte: today, // 今日以前
        },
        // 開始日が今日以前
        startDate: {
          lte: today,
        },
        // 終了日が未設定、または今日以降
        OR: [
          { endDate: null },
          { endDate: { gte: today } },
        ],
      },
      include: {
        tenant: true,
        client: true,
      },
    });

    const results = [];

    for (const template of templates) {
      try {
        // 既に今月の請求書が作成されているかチェック
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const existingInvoice = await prisma.invoice.findFirst({
          where: {
            recurringTemplateId: template.id,
            issueDate: {
              gte: new Date(now.getFullYear(), now.getMonth(), 1),
              lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
            },
          },
        });

        if (existingInvoice) {
          // 既に今月の請求書が作成されている場合はスキップ
          results.push({
            templateId: template.id,
            tenantName: template.tenant.name,
            status: "skipped",
            message: "今月の請求書は既に作成されています",
          });
          continue;
        }

        // 請求書を作成
        const items = JSON.parse(template.items) as Array<{
          name: string;
          quantity: number;
          unitPrice: number;
          taxRate?: number;
        }>;

        // 明細の合計を計算
        const subtotal = items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        );
        const user = await prisma.userProfile.findUnique({
          where: { id: template.client!.userId },
          select: { taxRate: true, taxRounding: true, invoiceNumberPrefix: true, invoiceNumberStart: true },
        });
        const taxRatePercent = user?.taxRate ?? items[0]?.taxRate ?? 10;
        const taxRounding = (user?.taxRounding ?? "floor") as TaxRounding;
        const taxAmount = calcTaxAmount(subtotal, taxRatePercent, taxRounding);
        const totalAmount = subtotal + taxAmount;

        // 発行日と支払期限を計算
        const issueDate = new Date(now.getFullYear(), now.getMonth(), template.creationDay);
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + 30); // デフォルト30日後

        // 請求書番号を生成

        const invoiceNumberPrefix = user?.invoiceNumberPrefix || "INV-";
        const invoiceNumberStart = user?.invoiceNumberStart || 1;

        // 今月の請求書数を取得してシーケンス番号を決定
        const thisMonthInvoices = await prisma.invoice.count({
          where: {
            userId: template.client!.userId,
            issueDate: {
              gte: new Date(now.getFullYear(), now.getMonth(), 1),
              lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
            },
          },
        });

        const sequence = invoiceNumberStart + thisMonthInvoices;
        const invoiceId = `${invoiceNumberPrefix}${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(sequence).padStart(3, "0")}`;

        // 請求書を作成
        const invoice = await prisma.invoice.create({
          data: {
            id: invoiceId,
            userId: template.client!.userId,
            clientId: template.clientId!,
            status: "DRAFT", // 下書き状態で作成
            issueDate,
            dueDate,
            subtotal,
            taxAmount,
            withholdingTax: 0,
            totalAmount,
            recurringTemplateId: template.id,
            items: {
              create: items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate || 10,
              })),
            },
          },
        });

        // 次回実行日を更新
        let nextExecutionDate = new Date(now);
        if (template.interval === "MONTHLY") {
          // 来月の作成日に設定
          nextExecutionDate = new Date(now.getFullYear(), now.getMonth() + 1, template.creationDay);
        } else if (template.interval === "WEEKLY") {
          // 来週の同じ曜日に設定
          nextExecutionDate.setDate(nextExecutionDate.getDate() + 7);
        } else if (template.interval === "YEARLY") {
          // 来年の同じ日に設定
          nextExecutionDate = new Date(now.getFullYear() + 1, now.getMonth(), template.creationDay);
        }

        await prisma.recurringTemplate.update({
          where: { id: template.id },
          data: { nextExecutionDate },
        });

        results.push({
          templateId: template.id,
          tenantName: template.tenant.name,
          status: "success",
          invoiceId: invoice.id,
          message: "請求書を作成しました",
        });
      } catch (error) {
        console.error(`Error processing template ${template.id}:`, error);
        results.push({
          templateId: template.id,
          tenantName: template.tenant.name,
          status: "error",
          message: error instanceof Error ? error.message : "エラーが発生しました",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error executing recurring templates:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "エラーが発生しました",
      },
      { status: 500 }
    );
  }
}
