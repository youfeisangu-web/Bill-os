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

    console.log('📁 ファイル選択:', { name: file.name, size: file.size, type: file.type });

    setIsScanning(true);
    setError(null);

    try {
      // ファイルサイズチェック（4MB以下に圧縮）
      const MAX_SIZE = 4 * 1024 * 1024; // 4MB
      let processedFile = file;

      console.log('📊 ファイルサイズチェック:', { originalSize: file.size, maxSize: MAX_SIZE });

      // HEIC形式の場合はJPEGに変換
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      const isHeic = fileType === 'image/heic' || fileType === 'image/heif' || fileName.endsWith('.heic') || fileName.endsWith('.heif');
      
      if (isHeic) {
        console.log('🔄 HEIC形式を検出、JPEGに変換中...');
        try {
          const heic2any = (await import('heic2any')).default;
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
          });
          
          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          processedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
            type: 'image/jpeg',
            lastModified: file.lastModified,
          });
          
          console.log('✅ HEIC変換完了:', { 
            originalSize: file.size, 
            convertedSize: processedFile.size,
            originalType: file.type,
            convertedType: processedFile.type,
          });
        } catch (heicError: any) {
          console.error('❌ HEIC変換エラー:', heicError);
          setError(`HEIC形式の画像の変換に失敗しました: ${heicError?.message || String(heicError)}。JPEGまたはPNG形式の画像を使用してください。`);
          setIsScanning(false);
          return;
        }
      }

      // 画像の場合、大きければ圧縮
      if (processedFile.type.startsWith('image/') && processedFile.size > MAX_SIZE) {
        console.log('🔄 画像を圧縮中...');
        try {
          processedFile = await compressImage(processedFile, 3.5);
          console.log('✅ 圧縮完了:', { originalSize: file.size, compressedSize: processedFile.size });
        } catch (compressError: any) {
          console.error('❌ 圧縮エラー:', compressError);
          setError(`画像の圧縮に失敗しました: ${compressError?.message || String(compressError)}`);
          setIsScanning(false);
          return;
        }
      }

      // 最終チェック
      if (processedFile.size > MAX_SIZE) {
        const errorMsg = `ファイルサイズが大きすぎます（${Math.round(processedFile.size / 1024 / 1024)}MB）。3MB以下のファイルを選択してください。`;
        console.error('❌ ファイルサイズエラー:', errorMsg);
        setError(errorMsg);
        setIsScanning(false);
        return;
      }

      console.log('📤 Server Actionに送信中...', { 
        fileName: processedFile.name, 
        fileSize: processedFile.size, 
        fileSizeMB: Math.round(processedFile.size / 1024 / 1024 * 100) / 100,
        fileType: processedFile.type 
      });

      // Vercelの制限チェック（4.5MB以下であることを確認）
      const VERCEL_LIMIT = 4.5 * 1024 * 1024; // 4.5MB
      if (processedFile.size > VERCEL_LIMIT) {
        const errorMsg = `ファイルサイズが大きすぎます（${Math.round(processedFile.size / 1024 / 1024 * 100) / 100}MB）。Vercelの制限（4.5MB）を超えています。`;
        console.error('❌ ファイルサイズエラー:', errorMsg);
        setError(errorMsg);
        setIsScanning(false);
        return;
      }

      // Server Actionに送信
      const formData = new FormData();
      formData.append('file', processedFile);
      
      // FormDataの内容を確認
      const fileInFormData = formData.get('file') as File | null;
      console.log('📋 FormData作成完了:', {
        hasFile: formData.has('file'),
        fileInFormData: fileInFormData ? {
          name: fileInFormData.name,
          size: fileInFormData.size,
          type: fileInFormData.type,
        } : 'no',
        originalFile: {
          name: processedFile.name,
          size: processedFile.size,
          type: processedFile.type,
        },
      });

      // FormDataにファイルが正しく含まれているか確認
      if (!fileInFormData || fileInFormData.size === 0) {
        const errorMsg = 'ファイルがFormDataに正しく含まれていません。ページを再読み込みして再試行してください。';
        console.error('❌ FormDataエラー:', errorMsg);
        setError(errorMsg);
        setIsScanning(false);
        return;
      }

      console.log('⏳ OCR処理を開始...');
      const startTime = Date.now();
      
      let result;
      try {
        // Server Actionを呼び出す前に、ファイル情報を再度確認
        console.log('🚀 Server Action呼び出し直前:', {
          fileName: processedFile.name,
          fileSize: processedFile.size,
          fileSizeMB: Math.round(processedFile.size / 1024 / 1024 * 100) / 100,
          fileType: processedFile.type,
          formDataFileSize: fileInFormData.size,
          formDataFileSizeMB: Math.round(fileInFormData.size / 1024 / 1024 * 100) / 100,
        });
        
        console.log('📡 Server Actionを呼び出します...');
        const actionStartTime = Date.now();
        
        result = await readReceiptImage(formData);
        
        const actionDuration = Date.now() - actionStartTime;
        console.log(`✅ Server Action完了: ${actionDuration}ms`);
      } catch (serverError: any) {
        const elapsed = Date.now() - startTime;
        console.error(`❌ Server Action呼び出しエラー (経過時間: ${elapsed}ms):`, serverError);
        console.error('エラー詳細:', {
          name: serverError?.name,
          message: serverError?.message,
          stack: serverError?.stack?.substring(0, 500),
          cause: serverError?.cause,
        });
        
        // 400 Bad Requestエラーの場合
        if (serverError?.message?.includes('400') || serverError?.message?.includes('Bad Request')) {
          const errorMsg = `リクエストが不正です（400 Bad Request）。\n\n考えられる原因:\n1. ファイル形式がサポートされていない（現在: ${processedFile.type || '不明'}）\n2. ファイルが破損している\n3. サーバーの制限に達している\n\nファイル形式: ${processedFile.type || '不明'}\nファイルサイズ: ${Math.round(processedFile.size / 1024 / 1024 * 100) / 100}MB`;
          console.error('❌ 400エラー詳細:', errorMsg);
          setError(errorMsg);
          setIsScanning(false);
          return;
        }
        
        throw serverError; // 他のエラーは再スロー
      }
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ OCR処理完了 (${duration}ms):`, result);

      if (result.success && result.data) {
        console.log('✅ OCR成功:', result.data);
        setInitialValues(receiptToInitialValues(result.data));
        setDialogOpen(true);
      } else {
        const errorMsg = result.message || '読み取りに失敗しました。もう一度お試しください。';
        console.error('❌ OCR失敗:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('❌ 予期しないエラー:', err);
      console.error('エラー詳細:', {
        name: err?.name,
        message: err?.message,
        stack: err?.stack,
        toString: err?.toString(),
      });
      
      let errorMessage = 'エラーが発生しました。もう一度お試しください。';
      if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.toString && err.toString() !== '[object Object]') {
        errorMessage = err.toString();
      }
      
      setError(`エラー: ${errorMessage}`);
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
