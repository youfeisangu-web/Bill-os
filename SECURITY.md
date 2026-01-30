# セキュリティポリシー

## 🔒 セキュリティ対策

Bill OSでは、以下のセキュリティ対策を実装しています。

### 認証・認可

- **Clerk認証**: すべての認証はClerk経由で管理
- **Middleware保護**: `/dashboard`と`/admin`ルートは認証必須
- **Server Actions**: すべてのServer Actionsで認証チェックを実施
- **APIルート**: 認証が必要なAPIエンドポイントで認証チェックを実施

### データベースセキュリティ

- **Prisma ORM**: SQLインジェクション対策（パラメータ化クエリ）
- **ユーザー分離**: すべてのデータ操作で`userId`を確認
- **入力値検証**: すべての入力値に対して型チェックとバリデーションを実施

### ファイルアップロード

- **ファイルタイプ検証**: 画像ファイル（JPEG、PNG、GIF、WebP）のみ許可
- **ファイルサイズ制限**: 5MB以下
- **ファイル名サニタイゼーション**: 危険な文字を除去
- **パストラバーサル対策**: `..`、`/`、`\`を含むファイル名を拒否

### 入力値検証

- **型チェック**: TypeScriptによる型安全性
- **長さ制限**: 適切な長さ制限を設定（将来実装予定）
- **日付検証**: 日付形式の検証を実施
- **数値検証**: 数値型の検証を実施

### エラーハンドリング

- **エラーメッセージ**: 詳細なエラー情報をユーザーに表示しない
- **ログ記録**: エラーはサーバー側でログに記録

## 🚨 脆弱性の報告

セキュリティ上の脆弱性を発見した場合、以下の方法で報告してください：

1. **GitHub Security Advisory**: プライベートで報告
2. **メール**: [セキュリティチームのメールアドレス]

**重要**: 公開のIssueやプルリクエストで脆弱性を報告しないでください。

## 📋 セキュリティチェックリスト

開発時は以下のチェックリストを確認してください：

- [ ] 認証チェックが実装されているか
- [ ] 入力値のバリデーションが実装されているか
- [ ] SQLインジェクション対策がされているか（Prisma使用で自動対応）
- [ ] XSS対策がされているか（Reactの自動エスケープ）
- [ ] ファイルアップロードの検証が実装されているか
- [ ] エラーメッセージに機密情報が含まれていないか
- [ ] 環境変数が`.gitignore`に含まれているか

## 🔐 環境変数の管理

機密情報は環境変数として管理し、`.env`ファイルをGitにコミットしないでください。

**必須の環境変数**:
- `DATABASE_URL`: データベース接続URL
- `CLERK_SECRET_KEY`: Clerk認証のシークレットキー
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase匿名キー

## 📚 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Clerk Security](https://clerk.com/docs/security)
