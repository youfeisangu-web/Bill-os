"use server";

import { auth } from "@clerk/nextjs/server";
import { openai } from "@/lib/openai";

type OCRResult = {
  success: boolean;
  data?: {
    date: string; // YYYY-MM-DD形式
    amount: number;
    name: string; // 振込名義（カナ推奨）
  };
  message?: string;
};

/**
 * 通帳または振込明細の画像をOCRで読み取り、取引データを抽出する
 * @param formData FormData（fileフィールドに画像ファイルを含む）
 * @returns OCRResult
 */
export async function readBankBookImage(formData: FormData): Promise<OCRResult> {
  try {
    // 認証チェック
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "認証が必要です" };
    }

    // APIキーのチェック
    if (!process.env.OPENAI_API_KEY) {
      return { success: false, message: "OpenAI APIキーが設定されていません" };
    }

    // FormDataからファイルを取得
    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, message: "画像ファイルが指定されていません" };
    }

    // ファイルタイプの検証
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, message: "画像ファイル（JPEG、PNG、GIF、WebP）を選択してください" };
    }

    // ファイルサイズの検証（10MB以下）
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, message: "ファイルサイズは10MB以下にしてください" };
    }

    // ファイルをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Base64エンコード
    const base64Image = buffer.toString("base64");

    // MIMEタイプを取得（デフォルトはjpeg）
    const mimeType = file.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // OpenAI Vision APIにリクエストを送信
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "この通帳または振込明細の画像を解析し、最新の取引データを抽出してください。以下のJSON形式のみを返してください（Markdown記法は不要）: { date: 'YYYY-MM-DD', amount: 数値, name: '振込名義（カタカナ推奨）' }",
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1, // 低い温度でより正確な結果を期待
    });

    // レスポンスからテキストを取得
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return { success: false, message: "AIからの応答がありませんでした" };
    }

    // JSONを抽出（Markdownコードブロックがある場合を考慮）
    let jsonText = responseText.trim();
    
    // Markdownコードブロックを除去
    if (jsonText.startsWith("```")) {
      const lines = jsonText.split("\n");
      jsonText = lines
        .filter((line) => !line.startsWith("```"))
        .join("\n")
        .trim();
    }

    // JSONをパース
    let parsedData: { date: string; amount: number; name: string };
    try {
      parsedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Response text:", responseText);
      return { success: false, message: "AIの応答を解析できませんでした" };
    }

    // データの検証
    if (!parsedData.date || !parsedData.amount || !parsedData.name) {
      return { success: false, message: "必要なデータが抽出できませんでした" };
    }

    // 日付形式の検証（YYYY-MM-DD）
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(parsedData.date)) {
      return { success: false, message: "日付の形式が正しくありません（YYYY-MM-DD形式が必要）" };
    }

    // 金額の検証（数値であること）
    const amount = Number(parsedData.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, message: "金額が正しくありません" };
    }

    return {
      success: true,
      data: {
        date: parsedData.date,
        amount: amount,
        name: parsedData.name.trim(),
      },
    };
  } catch (error) {
    console.error("OCR error:", error);
    
    // OpenAI APIエラーの場合
    if (error instanceof Error) {
      // APIキーエラー
      if (error.message.includes("API key") || error.message.includes("401")) {
        return { success: false, message: "OpenAI APIキーが無効です" };
      }
      // レート制限エラー
      if (error.message.includes("rate limit") || error.message.includes("429")) {
        return { success: false, message: "APIの利用制限に達しました。しばらく待ってから再試行してください" };
      }
      // その他のエラー
      return { success: false, message: `エラーが発生しました: ${error.message}` };
    }

    return { success: false, message: "予期しないエラーが発生しました" };
  }
}
