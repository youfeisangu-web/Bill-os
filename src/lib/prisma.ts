import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

/**
 * Prismaクライアントのシングルトンインスタンス
 * 開発環境でのホットリロード時に接続数が増えすぎないようにするため、
 * globalオブジェクトにインスタンスを保存するシングルトンパターンを実装
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// 本番環境でもグローバルに保存（Next.jsの最適化のため）
globalForPrisma.prisma = prisma;
