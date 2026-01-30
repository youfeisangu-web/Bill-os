import OpenAI from 'openai';

// APIキーが設定されていない場合でも、サーバー起動自体は止めないようにする
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});
