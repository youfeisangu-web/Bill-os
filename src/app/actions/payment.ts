'use server'

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { validateRequired, validatePositiveInteger, validateDate, validateUUID, MAX_LENGTHS, validateLength } from '@/lib/validation';
import { createPaymentWithStatus } from './payment-status';

// 入金データを保存する（PaymentStatusと連携）
export async function savePayment(tenantId: string, amount: number, dateStr: string) {
  // 認証チェック
  const { userId } = await auth();
  if (!userId) {
    throw new Error('認証が必要です');
  }

  // 入力値のバリデーション
  validateRequired(tenantId, '入居者ID');
  validateUUID(tenantId, '入居者ID');
  validatePositiveInteger(amount, '金額');
  validateDate(dateStr, '日付');
  
  // 金額の上限チェック（10億円）
  if (amount > 1000000000) {
    throw new Error('金額が大きすぎます');
  }

  // PaymentStatusと連携して保存
  const result = await createPaymentWithStatus(tenantId, amount, dateStr);
  if (!result.success) {
    throw new Error(result.message);
  }

  revalidatePath('/dashboard'); // ダッシュボードを更新
  revalidatePath('/dashboard/ledger'); // 月次入金台帳も更新
}

// 特定の入居者の支払い履歴を取ってくる
export async function getPaymentsByTenant(tenantId: string) {
  // 認証チェック
  const { userId } = await auth();
  if (!userId) {
    throw new Error('認証が必要です');
  }

  // 入力値のバリデーション
  validateRequired(tenantId, '入居者ID');
  validateUUID(tenantId, '入居者ID');

  // 入居者が存在することを確認（将来的にユーザー権限チェックを追加可能）
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new Error('入居者が見つかりません');
  }

  return await prisma.payment.findMany({
    where: { tenantId },
    orderBy: { date: 'desc' }
  });
}
