import { auth } from "@clerk/nextjs/server";

/**
 * 管理者権限をチェックする関数
 * 環境変数 ADMIN_USER_ID に設定されたユーザーIDのみが管理者として認証されます
 */
export async function isAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) {
    console.warn("ADMIN_USER_ID が環境変数に設定されていません。");
    return false;
  }

  return userId === adminUserId;
}

/**
 * 管理者IDを取得する関数（デバッグ用）
 */
export function getAdminUserId(): string | undefined {
  return process.env.ADMIN_USER_ID;
}
