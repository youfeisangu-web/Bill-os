/**
 * 入金消込機能の型定義
 */

export type ReconcileStatus = '完了' | 'エラー' | '確認' | '未完了';

export type ReconcileResult = {
  date: string;
  amount: number;
  rawName: string;
  status: ReconcileStatus;
  message: string;
  tenantId: string | null;
};

export type ReconcileResponse = {
  success: boolean;
  data?: ReconcileResult[];
  error?: string;
};
