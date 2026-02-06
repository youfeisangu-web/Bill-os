'use client';

import { useState, useRef } from 'react';
import { scanAndSaveDocument } from '@/app/actions/ocr'; // さっき作った機能をインポート
import { Loader2, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

export default function ExpensesPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      // 1. フォームデータを作る
      const formData = new FormData();
      formData.append('file', file);

      // 2. Server Action (OCR + Supabase保存) を呼び出す
      // ※ここで「裏口」を使うのでRLSエラーが出なくなります
      const data = await scanAndSaveDocument(formData);
      
      if (data.success) {
        setResult(data);
        console.log('スキャン成功:', data);
      } else {
        console.error('スキャン失敗:', data);
        const errorMsg = data.message || 'スキャンに失敗しました。もう一度お試しください。';
        setError(errorMsg);
      }

    } catch (err: any) {
      console.error('スキャンエラー:', err);
      const errorMessage = err?.message || err?.toString() || 'スキャンに失敗しました。もう一度お試しください。';
      setError(`エラー: ${errorMessage}`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">経費管理</h1>
        <p className="text-gray-500 mt-2">領収書をアップロードして、AIに自動入力させましょう。</p>
      </div>

      {/* アップロードエリア */}
      <div 
        className="bg-white border-2 border-dashed border-indigo-200 rounded-2xl p-10 text-center hover:bg-indigo-50 transition cursor-pointer relative group"
        onClick={() => {
          if (!isScanning && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*, .pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isScanning}
        />
        
        {isScanning ? (
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-lg font-semibold text-indigo-700">AIが解析中...</p>
            <p className="text-sm text-indigo-500">画像をSupabaseに保存しています</p>
          </div>
        ) : (
          <div className="flex flex-col items-center group-hover:scale-105 transition-transform">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-xl font-bold text-gray-700">ここをクリックして領収書を選択</p>
            <p className="text-sm text-gray-400 mt-2">またはドラッグ＆ドロップ (JPG, PNG, PDF)</p>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* 結果表示エリア */}
      {result && (
        <div className="bg-white shadow-lg rounded-xl border p-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 mb-6 text-green-600">
            <CheckCircle className="w-6 h-6" />
            <span className="font-bold text-lg">読み取り完了</span>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 左側: 読み取った画像 */}
            <div className="bg-gray-100 rounded-lg p-2 border">
              {/* SupabaseのURLを表示 */}
              <img src={result.imageUrl} alt="Uploaded Receipt" className="w-full h-auto rounded shadow-sm" />
            </div>

            {/* 右側: 読み取ったデータ */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">日付</label>
                <input 
                  type="date" 
                  defaultValue={result.transactionDate} 
                  className="block w-full mt-1 p-2 border rounded font-mono"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">支払先</label>
                <input 
                  type="text" 
                  defaultValue={result.merchantName} 
                  className="block w-full mt-1 p-2 border rounded font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">合計金額</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">¥</span>
                  <input 
                    type="number" 
                    defaultValue={result.totalAmount} 
                    className="block w-full mt-1 pl-8 p-2 border rounded text-2xl font-bold text-indigo-600"
                  />
                </div>
              </div>

              {result.registrationNumber && (
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                    インボイス登録番号: {result.registrationNumber}
                  </span>
                </div>
              )}

              <button className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition mt-4">
                この内容で登録する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
