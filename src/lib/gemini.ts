import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

/** Gemini API クライアント（APIキー未設定時はnull） */
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    if (!apiKey) {
      throw new Error("Gemini APIキーが設定されていません（GEMINI_API_KEY または GOOGLE_GENERATIVE_AI_API_KEY）");
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

/** リトライ付きAPI呼び出し */
async function retryApiCall<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // 429エラー（レート制限）の場合はリトライ
      if (error?.status === 429 || error?.code === 429 || error?.message?.includes("429")) {
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt); // 指数バックオフ
          console.warn(`API rate limit reached. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // 429以外のエラーまたはリトライ上限に達した場合はそのままエラーを投げる
      throw error;
    }
  }
  
  throw lastError || new Error("API呼び出しに失敗しました");
}

/** テキストのみで生成（漢字→カナ変換・列検出など） */
export async function generateText(prompt: string, options?: { maxTokens?: number }): Promise<string> {
  return retryApiCall(async () => {
    const gemini = getGeminiClient();
    const response = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        maxOutputTokens: options?.maxTokens ?? 500,
      },
    });
    return response.text ?? "";
  });
}

/** 画像 + テキストで生成（通帳OCRなど） */
export async function generateContentWithImage(
  prompt: string,
  imageBase64: string,
  mimeType: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  return retryApiCall(async () => {
    const gemini = getGeminiClient();
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
  });
}
