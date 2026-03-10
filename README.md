# Billia

AIで、請求管理をもっとラクに。
請求書・見積書・経費・支払い・財務 — すべてをひとつに。

🌐 **サイト**: https://billia-inc.com

---

## 概要

Billiaは、個人事業主・中小企業向けのクラウド請求管理SaaSです。
インボイス制度・電帳法に対応し、AIを活用した請求書作成・OCR読み込み・入金消込を提供します。

### 主な機能

| 機能 | 説明 |
|------|------|
| 請求書管理 | 作成・編集・PDF出力・メール送信・承認フロー |
| 見積書管理 | 作成・承認リンク発行・請求書への変換 |
| 経費管理 | 経費登録・OCR読み込み（領収書画像→自動入力） |
| 支払い管理 | 支払先の管理・支払ステータス追跡 |
| 入金消込 | 銀行CSVをアップロードしてAIが自動マッチング |
| 財務サマリー | 売上・入金・未払いの集計 |
| 音声入力 | 「山田商事に50万請求して」と話すだけで請求書作成 |
| 定期請求 | 毎月の定期請求書を自動生成 |
| 取引先管理 | 取引先情報の一元管理 |

---

## 技術スタック

| カテゴリ | 使用技術 |
|----------|----------|
| フレームワーク | Next.js 15+ (App Router) |
| 言語 | TypeScript |
| UI | Tailwind CSS, Shadcn UI |
| 認証 | Clerk |
| DB | PostgreSQL + Prisma ORM |
| ストレージ | Supabase Storage（ロゴ・角印・画像） |
| AI | Google Gemini API（OCR・消込・音声解析） |
| デプロイ | Vercel |

---

## セットアップ

### 前提条件

- Node.js 20以上
- PostgreSQLデータベース
- Clerkアカウント
- Supabaseアカウント
- Google Gemini APIキー

### 手順

```bash
# 1. クローン
git clone https://github.com/youfeisangu-web/Bill-os.git
cd Bill-os

# 2. 依存関係インストール
npm install

# 3. 環境変数を設定（下記参照）
cp .env.example .env

# 4. DBセットアップ
npx prisma migrate dev
npx prisma generate

# 5. 開発サーバー起動
npm run dev
```

### 環境変数

```env
# データベース (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Clerk (認証)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase Storage (画像アップロード)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Gemini AI (OCR・消込・音声解析)
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash  # 省略時のデフォルト
```

---

## ディレクトリ構成

```
src/
├── app/
│   ├── page.tsx                    # トップページ（LP）
│   ├── layout.tsx                  # ルートレイアウト（OGP設定など）
│   ├── actions/                    # Server Actions（DBアクセスはここ）
│   │   ├── invoice.ts              # 請求書の作成・更新・削除
│   │   ├── quote.ts                # 見積書の作成・更新・削除
│   │   ├── expense.ts              # 経費の作成・更新・削除
│   │   ├── bill.ts                 # 支払いの管理
│   │   ├── client.ts               # 取引先の管理
│   │   ├── payment.ts              # 入金ステータスの更新
│   │   ├── payment-status.ts       # 入金ステータス変更
│   │   ├── finance.ts              # 財務集計
│   │   ├── recurring.ts            # 定期請求の管理
│   │   ├── memo-parser.ts          # 音声・テキストからAIで請求書生成
│   │   ├── ocr-receipt.ts          # 領収書OCR（Gemini）
│   │   ├── ocr-document.ts         # 請求書OCR（Gemini）
│   │   ├── send-email.ts           # メール送信
│   │   ├── approval.ts             # 承認フロー
│   │   ├── settings.ts             # 会社設定・銀行口座
│   │   ├── onboarding.ts           # 初回セットアップ
│   │   ├── tenant.ts               # 入居者管理
│   │   ├── tenant-group.ts         # 入居者グループ
│   │   └── sales-category.ts       # 売上カテゴリ
│   ├── api/
│   │   ├── reconcile/route.ts      # 入金消込API
│   │   ├── recurring/execute/      # 定期請求の実行API
│   │   └── export/                 # CSV/PDFエクスポート
│   ├── dashboard/                  # ログイン後の各画面
│   │   ├── page.tsx                # ダッシュボードホーム
│   │   ├── invoices/               # 請求書一覧・作成・詳細・編集
│   │   ├── quotes/                 # 見積書一覧・作成・詳細
│   │   ├── expenses/               # 経費一覧・入力
│   │   ├── bills/                  # 支払い一覧・登録
│   │   ├── clients/                # 取引先一覧・登録
│   │   ├── finance/                # 財務サマリー
│   │   ├── sales/                  # 売上管理
│   │   ├── aging/                  # エイジング（未払い管理）
│   │   ├── recurring/              # 定期請求設定
│   │   ├── tenants/                # 入居者管理
│   │   └── settings/               # 設定（会社情報・メンバー）
│   ├── reconcile/                  # 入金消込ページ
│   ├── accept/[token]/             # 見積書承認ページ（外部公開）
│   ├── onboarding/                 # 初回セットアップ
│   ├── sign-in/ / sign-up/         # 認証ページ
│   └── admin/                      # 管理者ページ
├── components/
│   ├── ui/                         # Shadcn UIの基本コンポーネント
│   ├── invoice-template.tsx        # 請求書PDFテンプレート
│   ├── receipt-template.tsx        # 領収書PDFテンプレート
│   ├── dashboard-sidebar.tsx       # サイドバーナビゲーション
│   ├── dashboard-header.tsx        # ヘッダー
│   ├── voice-input-button.tsx      # 音声入力ボタン
│   ├── send-email-dialog.tsx       # メール送信ダイアログ
│   └── ...
├── hooks/
│   └── useSpeechRecognition.ts     # 音声認識カスタムフック
├── lib/
│   ├── prisma.ts                   # Prismaクライアント（シングルトン）
│   ├── gemini.ts                   # Gemini APIクライアント
│   ├── supabase-client.ts          # Supabaseクライアント
│   ├── utils.ts                    # 共通ユーティリティ
│   ├── validation.ts               # バリデーション
│   ├── error-translator.ts         # エラーメッセージ日本語化
│   └── __tests__/                  # ユニットテスト
├── types/
│   └── reconcile.ts                # 入金消込の型定義
└── middleware.ts                   # 認証ミドルウェア（Clerk）
```

---

## 主要機能の仕組み

### 音声入力で請求書作成
1. ユーザーが話す or テキスト入力
2. `actions/memo-parser.ts` がGemini APIに送信
3. AIが取引先・金額・件名・支払期日を抽出
4. 請求書エディタに自動入力

### 領収書・請求書OCR
1. 画像/PDFをアップロード
2. `actions/ocr-receipt.ts` or `ocr-document.ts` がGemini Vision APIに送信
3. AIが明細・金額・日付を抽出して自動入力

### 入金消込（AIマッチング）
1. 銀行のCSV（Shift_JIS対応）をアップロード
2. `api/reconcile/route.ts` が金額・名前の類似度で取引先とマッチング
3. 確定ボタンで入金ステータスを更新

---

## テスト

```bash
npm run test           # テスト実行
npm run test:ui        # UIモードで確認
npm run test:coverage  # カバレッジ確認
npm run type-check     # 型チェック
```

---

## デプロイ

Vercelに自動デプロイされます。`main`ブランチへのプッシュでVercelが自動ビルド・デプロイを実行します。

```bash
git push origin main  # → Vercelが自動デプロイ
```
