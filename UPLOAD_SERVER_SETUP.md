# ファイルアップロードサーバーのセットアップ方法

## 概要
Vercelの制限を回避するため、自分でファイルアップロード用のサーバーを用意する方法です。

## 必要なもの
- Node.jsサーバー（Vercel以外のホスティングサービス）
- 例: Railway, Render, Fly.io, 自社サーバーなど

## 実装方法

### 1. シンプルなExpressサーバーの例

```javascript
// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// アップロード先ディレクトリ
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer設定（最大50MB）
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// ファイルアップロードエンドポイント
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'ファイルが指定されていません' });
  }

  // 公開URLを返す（例: https://your-server.com/files/filename.jpg）
  const fileUrl = `${req.protocol}://${req.get('host')}/files/${req.file.filename}`;
  
  res.json({ url: fileUrl });
});

// ファイル配信エンドポイント
app.get('/files/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'ファイルが見つかりません' });
  }
  res.sendFile(filePath);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
```

### 2. package.json

```json
{
  "name": "file-upload-server",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5"
  }
}
```

### 3. 環境変数の設定

`.env`ファイルに以下を追加：

```env
# アップロードサーバーのURL
NEXT_PUBLIC_UPLOAD_SERVER_URL=https://your-server.com
```

### 4. コードの変更

`expenses-client.tsx`で、Supabase Storageの代わりにこのサーバーを使用するように変更します。
