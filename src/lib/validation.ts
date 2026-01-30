/**
 * 入力値のバリデーション用ユーティリティ
 */

// 最大長の定義
export const MAX_LENGTHS = {
  name: 100,
  nameKana: 100,
  email: 255,
  address: 500,
  phoneNumber: 20,
  invoiceRegNumber: 20,
  companyName: 100,
  title: 200,
  category: 50,
  note: 1000,
} as const;

/**
 * 文字列の長さを検証
 */
export function validateLength(value: string, maxLength: number, fieldName: string): void {
  if (value.length > maxLength) {
    throw new Error(`${fieldName}は${maxLength}文字以下で入力してください。`);
  }
}

/**
 * 必須フィールドを検証
 */
export function validateRequired(value: string | null | undefined, fieldName: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${fieldName}は必須です。`);
  }
}

/**
 * メールアドレスの形式を検証
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('有効なメールアドレスを入力してください。');
  }
}

/**
 * 数値が正の整数であることを検証
 */
export function validatePositiveInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName}は正の整数で入力してください。`);
  }
}

/**
 * 日付が有効であることを検証
 */
export function validateDate(dateStr: string, fieldName: string): Date {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`${fieldName}は有効な日付形式で入力してください。`);
  }
  return date;
}

/**
 * UUID形式を検証
 */
export function validateUUID(uuid: string, fieldName: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new Error(`${fieldName}は有効なUUID形式で入力してください。`);
  }
}
