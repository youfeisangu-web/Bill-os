/**
 * エラーメッセージを日本語に翻訳するユーティリティ
 */
export function translateErrorMessage(message: string): string {
  const translations: Record<string, string> = {
    // 認証・権限エラー
    "Unauthorized": "認証が必要です。ログインしてください。",
    "Forbidden": "アクセス権限がありません。",
    "Authentication": "認証エラーが発生しました。ログインし直してください。",
    
    // HTTPエラー
    "Not Found": "リソースが見つかりませんでした。",
    "404": "ページが見つかりませんでした。",
    "Internal Server Error": "サーバーエラーが発生しました。しばらく待ってから再試行してください。",
    "500": "サーバーエラーが発生しました。しばらく待ってから再試行してください。",
    "Bad Request": "リクエストが不正です。入力内容を確認してください。",
    "400": "リクエストが不正です。入力内容を確認してください。",
    
    // ネットワークエラー
    "Network Error": "ネットワークエラーが発生しました。インターネット接続を確認してください。",
    "Failed to fetch": "データの取得に失敗しました。ネットワーク接続を確認してください。",
    "Network request failed": "ネットワークリクエストに失敗しました。インターネット接続を確認してください。",
    "timeout": "タイムアウトが発生しました。しばらく待ってから再試行してください。",
    
    // APIエラー
    "API key": "APIキーが設定されていません。",
    "API Key": "APIキーが設定されていません。",
    "rate limit": "APIの利用制限に達しました。しばらく待ってから再試行してください。",
    "429": "APIの利用制限に達しました。しばらく待ってから再試行してください。",
    "RESOURCE_EXHAUSTED": "APIの利用制限に達しました。しばらく待ってから再試行してください。",
    "Resource exhausted": "APIの利用制限に達しました。しばらく待ってから再試行してください。",
    
    // ファイルエラー
    "File too large": "ファイルサイズが大きすぎます。",
    "Invalid file type": "対応していないファイル形式です。",
    "File not found": "ファイルが見つかりませんでした。",
    "File size": "ファイルサイズが大きすぎます。",
    
    // データエラー
    "Cannot read properties": "データの読み込みに失敗しました。",
    "Unexpected token": "データの形式が正しくありません。",
    "JSON": "データの解析に失敗しました。",
    "Parse error": "データの解析に失敗しました。",
    
    // その他
    "Error": "エラーが発生しました。",
    "Unknown error": "不明なエラーが発生しました。",
  };

  const lowerMessage = message.toLowerCase();
  
  // 完全一致を優先
  if (translations[message]) {
    return translations[message];
  }
  
  // 部分一致をチェック
  for (const [key, translation] of Object.entries(translations)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return translation;
    }
  }

  // 英語のエラーメッセージがそのまま表示される場合は、一般的なメッセージを返す
  if (/^[a-zA-Z\s:()]+$/.test(message) && message.length > 5 && !message.includes("http") && !message.includes("www")) {
    return `エラーが発生しました: ${message}\n\n問題が続く場合は、ページを再読み込みしてください。`;
  }

  return message;
}
