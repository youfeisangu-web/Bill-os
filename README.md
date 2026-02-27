# Billia

企業向け次世代クラウド請求管理プラットフォーム

## 📋 概要

Billiaは、組織の請求業務を統合管理するクラウドERPです。インボイス制度・電帳法に完全対応し、承認フローの標準化、ガバナンス強化、経理DXを強力に推進します。

### 主な機能

- **請求書・見積書管理**: 見積書から請求書への変換、自動番号付与
- **顧客管理**: 取引先情報の一元管理
- **経費管理**: 経費の登録と管理
- **入金消込（AIマッチング）**: CSVファイルから入金情報を自動マッチング
- **入居者管理**: 家賃管理向けの入居者・支払い履歴管理
- **設定管理**: 会社情報、銀行口座、ブランディング（ロゴ・角印）の設定

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 16.1.2 (App Router)
- **言語**: TypeScript 5
- **UI**: React 19.2.3, Tailwind CSS 4, Shadcn UI
- **認証**: Clerk
- **データベース**: PostgreSQL (Prisma ORM)
- **ストレージ**: Supabase Storage (画像アップロード用)
- **その他**: PapaParse (CSV解析), string-similarity (文字列類似度判定)

## 🚀 セットアップ

### 前提条件

- Node.js 20以上
- PostgreSQLデータベース
- Clerkアカウント（認証用）
- Supabaseアカウント（ストレージ用、オプション）

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd billia
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定してください：

```env
# データベース
DATABASE_URL="postgresql://user:password@localhost:5432/bill_os"
DIRECT_URL="postgresql://user:password@localhost:5432/bill_os"

# Clerk認証
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase（画像アップロード用）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. データベースのセットアップ

```bash
# Prismaマイグレーション
npx prisma migrate dev

# Prismaクライアントの生成
npx prisma generate
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 📁 プロジェクト構造

```
billia/
├── prisma/
│   └── schema.prisma          # Prismaスキーマ定義
├── src/
│   ├── app/
│   │   ├── actions/           # Server Actions
│   │   │   ├── client.ts      # 顧客管理
│   │   │   ├── invoice.ts     # 請求書管理
│   │   │   ├── quote.ts       # 見積書管理
│   │   │   ├── payment.ts     # 支払い管理
│   │   │   └── tenant.ts      # 入居者管理
│   │   ├── api/
│   │   │   └── reconcile/     # 入金消込API
│   │   ├── dashboard/          # ダッシュボードページ
│   │   ├── reconcile/         # 入金消込ページ
│   │   └── ...
│   ├── components/            # Reactコンポーネント
│   │   ├── ui/                # Shadcn UIコンポーネント
│   │   └── ...
│   └── lib/
│       ├── prisma.ts          # Prismaクライアント（シングルトン）
│       └── supabase-client.ts # Supabaseクライアント
└── ...
```

## 🔧 主要機能の説明

### 入金消込（AIマッチング）

`/reconcile` ページで、銀行のCSVファイルをアップロードすると、以下のロジックで自動マッチングを行います：

1. **ファイル読み込み**: Shift_JISエンコーディングに対応
2. **口座振替チェック**: 収納代行会社（例: リコーリース）の自動判定
3. **金額一致チェック**: データベースの入居者データと金額を照合
4. **名前類似度判定**: `string-similarity`を使用してフリガナの類似度を計算（閾値: 0.6）
5. **結果表示**: マッチした場合は「確定」ボタンでデータベースに保存可能

#### CSVファイル形式

銀行のCSVファイルは以下の形式を想定しています：

```
日付,取引先コード,金額,名義人,...
2024/01/15,12345,85000,ヤマダタロウ,...
```

- 0列目: 日付
- 2列目: 金額
- 3列目: 名義人（カタカナ）

### データベーススキーマ

主要なモデル：

- **User**: ユーザー情報（Clerk連携）
- **UserProfile**: ユーザープロフィール（会社情報、設定など）
- **Client**: 顧客情報
- **Invoice**: 請求書
- **Quote**: 見積書
- **Tenant**: 入居者情報
- **Payment**: 支払い履歴

詳細は `prisma/schema.prisma` を参照してください。

## 🔒 セキュリティ

Billiaでは、以下のセキュリティ対策を実装しています：

- **認証・認可**: Clerk認証、Middleware保護、Server Actionsでの認証チェック
- **データベースセキュリティ**: Prisma ORMによるSQLインジェクション対策
- **ファイルアップロード**: ファイルタイプ検証、サイズ制限、ファイル名サニタイゼーション
- **入力値検証**: 型チェック、長さ制限、形式検証

詳細は [SECURITY.md](./SECURITY.md) を参照してください。

## ⚠️ 注意事項

### TypeScriptの型チェック

現在、`next.config.ts`で`ignoreBuildErrors: true`が設定されています。これは開発中の一時的な設定です。

**推奨**: 定期的に`npm run type-check`を実行して型エラーを確認し、可能な限り修正してください。

**改善状況**:
- ✅ `any`型の使用を削減（`reconcile/page.tsx`で型定義を追加）
- ✅ 型定義ファイルの作成（`src/types/reconcile.ts`）
- ✅ 不要な`@ts-expect-error`コメントの削除

### ライブラリの使用目的

- **Prisma**: データベース操作全般
- **Supabase**: 画像ストレージ（ロゴ・角印のアップロード）のみ
- **Clerk**: 認証・認可

データベース操作はPrisma経由で統一されています。

### バージョンについて

本プロジェクトは以下の新しいバージョンを使用しています：

- Next.js 16.1.2
- React 19.2.3
- Tailwind CSS 4

これらは比較的新しいバージョンのため、互換性の問題に遭遇する可能性があります。問題が発生した場合は、安定版（LTS）へのダウングレードを検討してください。

## 🧪 ビルド

```bash
npm run build
```

ビルド前に自動的に`prisma generate`が実行されます。

## ✅ テスト

### テストの実行

```bash
# 全テストを実行
npm run test

# ウォッチモード（開発中）
npm run test -- --watch

# UIモード（ブラウザで結果を確認）
npm run test:ui

# カバレッジレポート
npm run test:coverage
```

### 型チェック

```bash
npm run type-check
```

このコマンドでTypeScriptの型エラーを確認できます。`.next/types`の自動生成ファイルによるエラーは無視して問題ありません。

### テストカバレッジ

現在、以下の機能に対してユニットテストを実装しています：

- **入金消込機能**: 文字列類似度判定、金額一致チェック、名前クリーンアップ
  - テストファイル: `src/lib/__tests__/reconcile.test.ts`
- **支払い管理機能**: 日付変換、金額バリデーション、UUID検証
  - テストファイル: `src/lib/__tests__/payment.test.ts`
- **入居者管理機能**: データバリデーション、フリガナ検証、データ変換
  - テストファイル: `src/lib/__tests__/tenant.test.ts`

**テスト結果**: 21個のテストがすべてパス ✅

## 🔄 CI/CD

### GitHub Actions

プロジェクトにはGitHub ActionsのCI/CDパイプラインが設定されています（`.github/workflows/ci.yml`）。

**実行内容**:
- 型チェック (`npm run type-check`)
- テスト実行 (`npm run test`)
- ビルド検証 (`npm run build`)

**トリガー**:
- `main`または`develop`ブランチへのプッシュ
- プルリクエスト作成時

**必要なシークレット**（GitHubリポジトリの設定で追加）:
- `DATABASE_URL`: データベース接続URL（テスト用）
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk公開キー
- `CLERK_SECRET_KEY`: Clerkシークレットキー

## 📝 開発ガイドライン

### Server Actions

データベース操作は`src/app/actions/`配下のServer Actionsで実装します。

例：
```typescript
'use server'

import { prisma } from '@/lib/prisma';

export async function createTenant(formData: FormData) {
  // ...
}
```

### Prismaクライアント

`src/lib/prisma.ts`からシングルトンインスタンスをインポートして使用します。これにより、開発環境でのホットリロード時の接続数増加を防ぎます。

```typescript
import { prisma } from '@/lib/prisma';

const tenants = await prisma.tenant.findMany();
```

## 📄 ライセンス

[ライセンス情報を記載]

## 🤝 コントリビューション

コントリビューションを歓迎します！詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。
