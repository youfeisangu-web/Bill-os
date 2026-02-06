"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { readReceiptImage } from "@/app/actions/ocr";
import type { ReceiptOCRData } from "@/app/actions/ocr";
import type { ExpenseInitialValues } from "./new-expense-dialog";
import NewExpenseDialog from "./new-expense-dialog";
import { Upload, Loader2 } from "lucide-react";
import { translateErrorMessage } from "@/lib/error-translator";
import heic2any from "heic2any";
import { supabase } from "@/lib/supabase-client";

export const RECEIPT_OCR_PREFILL_KEY = "receiptOcrPrefill";

function receiptToInitialValues(data: ReceiptOCRData): ExpenseInitialValues {
  return {
    title: data.title,
    amount: data.amount,
    date: data.date,
    category: data.category,
  };
}

export default function ExpensesClient({ userId }: { userId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialValues, setInitialValues] = useState<ExpenseInitialValues | null>(null);

  /** 画像をリサイズ・圧縮してファイルサイズを小さくする */
  const compressImage = async (file: File, maxSizeMB: number = 4): Promise<File> => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    // 既にサイズが小さい場合はそのまま返す
    if (file.size <= maxSizeBytes) {
      return file;
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            // 最大サイズに合わせてリサイズ（アスペクト比を維持）
            let width = img.width;
            let height = img.height;
            const maxDimension = 2000; // 最大2000px
            
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height * maxDimension) / width;
                width = maxDimension;
              } else {
                width = (width * maxDimension) / height;
                height = maxDimension;
              }
            }
            
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Canvas context not available"));
              return;
            }
            
            // 高品質で描画
            ctx.drawImage(img, 0, 0, width, height);
            
            // JPEG品質を調整して圧縮（0.7から開始）
            let quality = 0.7;
            const tryCompress = (q: number) => {
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    reject(new Error("Failed to compress image"));
                    return;
                  }
                  
                  // 目標サイズに達するまで品質を下げる
                  if (blob.size > maxSizeBytes && q > 0.3) {
                    tryCompress(q - 0.1);
                  } else {
                    const compressedFile = new File([blob], file.name.replace(/\.(png|gif|webp)$/i, ".jpg"), {
                      type: "image/jpeg",
                      lastModified: file.lastModified,
                    });
                    console.log("Image compressed:", {
                      originalSize: file.size,
                      compressedSize: compressedFile.size,
                      quality: q,
                    });
                    resolve(compressedFile);
                  }
                },
                "image/jpeg",
                q
              );
            };
            
            tryCompress(quality);
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
      reader.readAsDataURL(file);
    });
  };

  /** HEIC形式の画像をJPEGに変換 */
  const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
      console.log("Converting HEIC to JPEG using heic2any...");
      
      // heic2anyライブラリを使用してHEIC形式をJPEGに変換
      const convertedBlobs = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.9,
      });
      
      // 変換結果は配列で返される（複数ページの場合は複数のblob）
      const blob = Array.isArray(convertedBlobs) ? convertedBlobs[0] : convertedBlobs;
      
      if (!blob) {
        throw new Error("HEIC形式の変換に失敗しました");
      }
      
      // BlobをFileオブジェクトに変換
      const jpegFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
        type: "image/jpeg",
        lastModified: file.lastModified,
      });
      
      console.log("HEIC converted successfully:", {
        originalName: file.name,
        originalSize: file.size,
        convertedName: jpegFile.name,
        convertedSize: jpegFile.size,
      });
      
      return jpegFile;
    } catch (error: any) {
      console.error("HEIC conversion error:", error);
      throw new Error(`HEIC形式の変換に失敗しました: ${error?.message || String(error)}`);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      // ファイル情報をログに記録（デバッグ用）
      console.log("Processing file:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Vercelの制限（4.5MB）を考慮して、4MB以上の場合に自動圧縮
      const VERCEL_LIMIT = 4 * 1024 * 1024; // 4MB（安全マージン込み）
      const MAX_ORIGINAL_SIZE = 50 * 1024 * 1024; // 元のファイルサイズの上限50MB
      
      // HEIC形式の場合は自動的にJPEGに変換
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      let processedFile = file;
      
      if (fileType === "image/heic" || fileType === "image/heif" || fileName.endsWith(".heic") || fileName.endsWith(".heif")) {
        console.log("HEIC file detected, converting to JPEG...");
        try {
          processedFile = await convertHeicToJpeg(file);
          console.log("HEIC converted successfully:", {
            originalSize: file.size,
            convertedSize: processedFile.size,
          });
          
          // HEIC変換後も、サイズが大きい場合は圧縮
          if (processedFile.size > VERCEL_LIMIT) {
            console.log("Converted HEIC file is still too large, compressing...");
            processedFile = await compressImage(processedFile, 3.5);
          }
        } catch (conversionError: any) {
          console.error("HEIC conversion error:", conversionError);
          const errorMsg = conversionError?.message || "変換に失敗しました";
          alert(`HEIC形式の画像の変換に失敗しました。\n\n${errorMsg}\n\n【解決方法】\n1. iPhoneの場合: 設定 > カメラ > フォーマット > 「互換性優先」に変更してから写真を撮影\n2. または、写真アプリで画像を開き、「共有」>「写真を保存」でJPEG形式で保存\n3. または、JPEG/PNG形式の画像を使用してください\n\n現在のファイル: ${file.name}`);
          return;
        }
      }
      
      if (processedFile.size > MAX_ORIGINAL_SIZE) {
        alert(`ファイルサイズが大きすぎます（${Math.round(processedFile.size / 1024 / 1024)}MB）。最大50MBまで対応しています。`);
        return;
      }
      
      // 画像ファイルで4MBを超える場合は自動圧縮（HEIC変換後も含む）
      const isImage = processedFile.type.startsWith("image/") && 
        (processedFile.type === "image/jpeg" || processedFile.type === "image/jpg" || processedFile.type === "image/png" || 
         processedFile.type === "image/gif" || processedFile.type === "image/webp");
      
      if (isImage && processedFile.size > VERCEL_LIMIT) {
        console.log("Image size exceeds Vercel limit, compressing...", {
          originalSize: processedFile.size,
          limit: VERCEL_LIMIT,
          fileName: processedFile.name,
          fileType: processedFile.type,
        });
        try {
          const originalSize = processedFile.size;
          processedFile = await compressImage(processedFile, 3.5); // 3.5MBに圧縮（より安全なマージン）
          console.log("Image compressed successfully:", {
            originalSize: originalSize,
            compressedSize: processedFile.size,
            reduction: `${Math.round((1 - processedFile.size / originalSize) * 100)}%`,
          });
          
          // 圧縮後もまだ大きい場合はエラー
          if (processedFile.size > VERCEL_LIMIT) {
            alert(`画像の圧縮に失敗しました。ファイルサイズが大きすぎます（${Math.round(processedFile.size / 1024 / 1024)}MB）。\n\n【解決方法】\n- 画像の解像度を下げる\n- 画像編集ソフトでファイルサイズを小さくする（3MB以下を推奨）\n- 別の画像を試してください`);
            return;
          }
        } catch (compressError: any) {
          console.error("Image compression error:", compressError);
          alert(`画像の圧縮に失敗しました。\n\n${compressError?.message || "エラーが発生しました"}\n\n【解決方法】\n- ファイルサイズを小さくする（3MB以下を推奨）\n- 画像の解像度を下げる\n- 別の画像を試してください\n\n現在のファイルサイズ: ${Math.round(processedFile.size / 1024 / 1024)}MB`);
          return;
        }
      }
      
      // 最終的なサイズチェック（Vercelの制限）
      if (processedFile.size > VERCEL_LIMIT) {
        alert(`ファイルサイズが大きすぎます（${Math.round(processedFile.size / 1024 / 1024)}MB）。\n\nVercelの制限により、4MB以下のファイルのみアップロードできます。\n\n【解決方法】\n- 画像の解像度を下げる（3MB以下を推奨）\n- 画像編集ソフトでファイルサイズを小さくする\n- 別の画像を試してください`);
        return;
      }
      
      console.log("Final file ready for upload:", {
        name: processedFile.name,
        size: processedFile.size,
        type: processedFile.type,
        sizeMB: Math.round(processedFile.size / 1024 / 1024 * 100) / 100,
      });

      // Vercelの制限を回避するため、ファイルをアップロードしてからURLを渡す
      let fileUrl: string;
      
      try {
        // カスタムアップロードサーバーが設定されている場合はそれを使用、なければSupabase Storageを使用
        const uploadServerUrl = process.env.NEXT_PUBLIC_UPLOAD_SERVER_URL;
        
        if (uploadServerUrl) {
          // カスタムアップロードサーバーを使用
          console.log("Uploading to custom upload server:", uploadServerUrl);
          
          const uploadFormData = new FormData();
          uploadFormData.append("file", processedFile);
          
          const uploadResponse = await fetch(`${uploadServerUrl}/upload`, {
            method: "POST",
            body: uploadFormData,
          });
          
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({ error: "アップロードに失敗しました" }));
            throw new Error(errorData.error || `アップロードサーバーエラー: ${uploadResponse.status}`);
          }
          
          const uploadResult = await uploadResponse.json();
          fileUrl = uploadResult.url;
          
          if (!fileUrl) {
            throw new Error("アップロードサーバーからURLが返されませんでした");
          }
          
          console.log("File uploaded to custom server:", fileUrl);
        } else {
          // Supabase Storageにアップロード
          console.log("Uploading to Supabase Storage to avoid Vercel limit...");
          
          const timestamp = Date.now();
          const sanitizedFilename = processedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100);
          const fileName = `receipts/${userId}/${timestamp}-${sanitizedFilename}`;
          
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from("receipts")
            .upload(fileName, processedFile, {
              cacheControl: "3600",
              upsert: false,
            });
          
          if (uploadError) {
            throw new Error(`Supabase Storageへのアップロードに失敗しました: ${uploadError.message}`);
          }
          
          // Public URLを取得
          const { data: { publicUrl } } = supabase.storage.from("receipts").getPublicUrl(fileName);
          fileUrl = publicUrl;
          
          console.log("File uploaded to Supabase Storage:", fileUrl);
        }
      } catch (uploadError: any) {
        console.error("File upload error:", uploadError);
        const errorMessage = uploadError?.message || "エラーが発生しました";
        
        // RLSポリシーエラーの場合の特別なメッセージ
        if (errorMessage.includes("row-level security") || errorMessage.includes("RLS")) {
          alert(`ファイルのアップロードに失敗しました。\n\n【原因】\nSupabase Storageのセキュリティ設定（RLSポリシー）が正しく設定されていません。\n\n【解決方法】\n1. Supabaseダッシュボードにログイン\n2. Storage → receipts バケットを開く\n3. Policies → New Policy で以下を設定:\n   - 操作: INSERT, SELECT\n   - ターゲットロール: authenticated\n   - ポリシー: (bucket_id = 'receipts'::text) AND (auth.role() = 'authenticated'::text)\n\nまたは、カスタムアップロードサーバーを用意する場合は、.envに以下を追加:\nNEXT_PUBLIC_UPLOAD_SERVER_URL=https://your-server.com`);
        } else {
          alert(`ファイルのアップロードに失敗しました。\n\n${errorMessage}\n\n【解決方法】\n- ファイルサイズを小さくする（3MB以下を推奨）\n- 画像の解像度を下げる\n- 別の画像を試してください`);
        }
        return;
      }
      
      // FormDataの作成（URLを渡す）
      const formData = new FormData();
      formData.set("fileUrl", fileUrl);
      
      let result: Awaited<ReturnType<typeof readReceiptImage>>;
      try {
        console.log("Calling Server Action with file URL...");
        
        // Server Action呼び出し（タイムアウト対策）
        const actionPromise = readReceiptImage(formData);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("サーバーからの応答がタイムアウトしました。")), 90000); // 90秒
        });
        
        result = await Promise.race([actionPromise, timeoutPromise]);
        console.log("Server Action completed successfully");
        
        // 処理完了後、Supabase Storageからファイルを削除（オプション、Supabase使用時のみ）
        if (!process.env.NEXT_PUBLIC_UPLOAD_SERVER_URL) {
          try {
            // fileUrlからファイルパスを抽出（例: https://xxx.supabase.co/storage/v1/object/public/receipts/receipts/userId/timestamp-filename）
            // パス部分を取得: receipts/userId/timestamp-filename
            const urlParts = fileUrl.split("/receipts/");
            if (urlParts.length > 1) {
              const filePath = `receipts/${urlParts[1]}`;
              await supabase.storage.from("receipts").remove([filePath]);
              console.log("Temporary file removed from Supabase Storage:", filePath);
            }
          } catch (cleanupError) {
            console.warn("Failed to cleanup temporary file:", cleanupError);
            // クリーンアップの失敗は無視（一時ファイルは後で手動削除可能）
          }
        }
      } catch (serverError: any) {
        // Server Actionが例外をスローした場合
        console.error("Server Action error:", serverError);
        console.error("Error details:", {
          name: serverError?.name,
          message: serverError?.message,
          stack: serverError?.stack,
          cause: serverError?.cause,
        });
        
        // 400エラーの場合の特別な処理
        if (serverError?.message?.includes("400") || serverError?.message?.includes("Bad Request")) {
          console.error("400 Bad Request - Possible causes:", {
            fileName: processedFile.name,
            fileSize: processedFile.size,
            fileType: processedFile.type,
          });
          alert(`リクエストが不正です（400 Bad Request）。\n\n考えられる原因:\n1. ファイルサイズが大きすぎる（現在: ${Math.round(processedFile.size / 1024 / 1024)}MB）\n2. ファイル形式がサポートされていない\n3. サーバーの制限に達している\n\n【解決方法】\n- ファイルサイズを小さくする（10MB以下を推奨）\n- JPEGまたはPNG形式の画像を使用する\n- 画像の解像度を下げる`);
          return;
        }
        
        // 「予期しない応答」エラーの場合
        if (serverError?.message?.includes("unexpected response") || serverError?.message?.includes("予期しない応答")) {
          console.error("Unexpected response error - Full error:", serverError);
          alert(`サーバーから予期しない応答がありました。\n\n【考えられる原因】\n1. サーバーが一時的に利用できない\n2. ファイルサイズが大きすぎる\n3. ネットワークエラー\n\n【解決方法】\n1. しばらく待ってから再試行してください\n2. ファイルサイズを小さくする（10MB以下を推奨）\n3. 別の画像を試してください\n4. ページを再読み込みしてから再度お試しください`);
          return;
        }
        
        const errorMessage = serverError?.message || serverError?.toString() || "サーバーエラーが発生しました";
        console.error("Server Action error details:", {
          message: errorMessage,
          name: serverError?.name,
          stack: serverError?.stack?.substring(0, 500),
        });
        alert(translateErrorMessage(errorMessage));
        return;
      }
      
      // 結果の検証
      if (!result || typeof result !== "object") {
        console.error("Invalid result format:", result);
        alert("サーバーから予期しない形式の応答がありました。もう一度お試しください。");
        return;
      }
      
      console.log("Server Action result:", result);
      
      if (result.success && result.data) {
        console.log("OCR success! Data:", result.data);
        setInitialValues(receiptToInitialValues(result.data));
        setDialogOpen(true);
      } else {
        // Server Actionから返されたエラーメッセージを表示
        const errorMessage = result.message ?? "領収書・レシートの読み込みに失敗しました";
        console.error("OCR failed:", errorMessage);
        console.error("Full result:", result);
        alert(translateErrorMessage(errorMessage));
      }
    } catch (err) {
      // 予期しないエラー
      console.error("Unexpected error:", err);
      console.error("Error details:", {
        name: err instanceof Error ? err.name : "Unknown",
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      
      const errorMessage = err instanceof Error ? err.message : "エラーが発生しました";
      const japaneseMessage = translateErrorMessage(errorMessage);
      alert(japaneseMessage);
    } finally {
      setIsProcessing(false);
    }
  };


  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!isProcessing && inputRef.current) {
      console.log("Opening file dialog...");
      inputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file ? { name: file.name, size: file.size, type: file.type } : "no file");
    if (!file) return;
    e.target.value = "";
    await processFile(file);
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">レシート・領収書を読み込む</h2>
        <p className="text-sm text-slate-500 mb-4">
          AIが自動で経費情報を抽出します（画像、PDF、Excel、Word、テキストファイル対応、最大50MB）
        </p>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          className={`rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
            isProcessing
              ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-70"
              : isDragOver
              ? "border-blue-500 bg-blue-50 cursor-pointer"
              : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.xlsx,.xls,.docx,.doc,.txt,.csv,image/*,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
          {isProcessing ? (
            <>
              <Loader2 className="h-12 w-12 mx-auto text-blue-600 animate-spin mb-4" />
              <p className="font-semibold text-slate-900">読み込み中...</p>
              <p className="text-sm text-slate-500 mt-1">AIがレシート・領収書を解析しています</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <p className="font-semibold text-slate-900 mb-2">
                レシート・領収書・請求書をドラッグ&ドロップ
              </p>
              <p className="text-sm text-slate-600 font-medium">
                またはここをクリックしてファイルを選択
              </p>
            </>
          )}
        </div>
      </div>
      <NewExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialValues={initialValues}
      />
    </>
  );
}

