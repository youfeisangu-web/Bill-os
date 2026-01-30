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
  /** 請求書ベースの消し込みでマッチした請求書ID */
  invoiceId: string | null;
  /** マッチした請求書番号（表示・リンク用） */
  invoiceNumber?: string | null;
  /** マッチした取引先名（表示用） */
  clientName?: string | null;
  /** @deprecated 取引先ベースは廃止 */
  tenantId: string | null;
};

export type ReconcileResponse = {
  success: boolean;
  data?: ReconcileResult[];
  error?: string;
};
