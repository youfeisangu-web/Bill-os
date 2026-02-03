import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

/** Gemini API クライアント（APIキー未設定時は空文字で初期化し、呼び出し側でチェック） */
export const gemini = new GoogleGenAI({ apiKey });

/** テキストのみで生成（漢字→カナ変換・列検出など） */
export async function generateText(prompt: string, options?: { maxTokens?: number }): Promise<string> {
  const response = await gemini.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      maxOutputTokens: options?.maxTokens ?? 500,
    },
  });
  return response.text ?? "";
}

/** 画像 + テキストで生成（通帳OCRなど） */
export async function generateContentWithImage(
  prompt: string,
  imageBase64: string,
  mimeType: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const response = await gemini.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      { inlineData: { mimeType, data: imageBase64 } },
      { text: prompt },
    ],
    config: {
      maxOutputTokens: options?.maxTokens ?? 500,
      temperature: options?.temperature ?? 0.1,
    },
  });
  return response.text ?? "";
}
