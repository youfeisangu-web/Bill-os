'use client';

import { useState, useRef } from 'react';
import { readReceiptImage } from '@/app/actions/ocr';
import { Loader2, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import NewExpenseDialog from './new-expense-dialog';
import type { ExpenseInitialValues } from './new-expense-dialog';
import type { ReceiptOCRData } from '@/app/actions/ocr';

function receiptToInitialValues(data: ReceiptOCRData): ExpenseInitialValues {
  return {
    title: data.title,
    amount: data.amount,
    date: data.date,
    category: data.category,
  };
}

export default function ExpensesPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialValues, setInitialValues] = useState<ExpenseInitialValues | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    try {
      // ファイルサイズチェック（4MB以下に圧縮）
      const MAX_SIZE = 4 * 1024 * 1024; // 4MB
      let processedFile = file;

      // 画像の場合、大きければ圧縮
      if (file.type.startsWith('image/') && file.size > MAX_SIZE) {
        processedFile = await compressImage(file, 3.5);
      }

      // 最終チェック
      if (processedFile.size > MAX_SIZE) {
        setError(`ファイルサイズが大きすぎます（${Math.round(processedFile.size / 1024 / 1024)}MB）。3MB以下のファイルを選択してください。`);
        setIsScanning(false);
        return;
      }

      // Server Actionに送信
      const formData = new FormData();
      formData.append('file', processedFile);

      const result = await readReceiptImage(formData);

      if (result.success && result.data) {
        setInitialValues(receiptToInitialValues(result.data));
        setDialogOpen(true);
      } else {
        setError(result.message || '読み取りに失敗しました。もう一度お試しください。');
      }
    } catch (err: any) {
      console.error('エラー:', err);
      setError(err?.message || 'エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsScanning(false);
    }
  };

  // 画像圧縮関数
  const compressImage = async (file: File, maxSizeMB: number = 3.5): Promise<File> => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size <= maxSizeBytes) return file;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 2000;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.7;
          const tryCompress = (q: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('圧縮に失敗しました'));
                  return;
                }

                if (blob.size > maxSizeBytes && q > 0.3) {
                  tryCompress(q - 0.1);
                } else {
                  const compressedFile = new File([blob], file.name.replace(/\.(png|gif|webp)$/i, '.jpg'), {
                    type: 'image/jpeg',
                    lastModified: file.lastModified,
                  });
                  resolve(compressedFile);
                }
              },
              'image/jpeg',
              q
            );
          };

          tryCompress(quality);
        };
        img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
      reader.readAsDataURL(file);
    });
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

      {/* 経費登録ダイアログ */}
      <NewExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialValues={initialValues}
      />
    </div>
  );
}
