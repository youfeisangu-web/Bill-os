"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { readReceiptImage } from "@/app/actions/ocr";
import type { ReceiptOCRData } from "@/app/actions/ocr";
import type { ExpenseInitialValues } from "./new-expense-dialog";
import NewExpenseDialog from "./new-expense-dialog";
import { Upload, Loader2 } from "lucide-react";
import { translateErrorMessage } from "@/lib/error-translator";

export const RECEIPT_OCR_PREFILL_KEY = "receiptOcrPrefill";

function receiptToInitialValues(data: ReceiptOCRData): ExpenseInitialValues {
  return {
    title: data.title,
    amount: data.amount,
    date: data.date,
    category: data.category,
  };
}

export default function ExpensesClient() {
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

  /** HEIC形式の画像をJPEGに変換（可能な場合） */
  const convertHeicToJpeg = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      // HEIC形式はブラウザで直接処理できない場合が多いため、
      // まずはFileReaderで読み込んでみる
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Canvas context not available"));
              return;
            }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to convert image"));
                  return;
                }
                const jpegFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
                  type: "image/jpeg",
                  lastModified: file.lastModified,
                });
                resolve(jpegFile);
              },
              "image/jpeg",
              0.95
            );
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = () => {
          reject(new Error("HEIC形式の画像を読み込めませんでした。JPEGまたはPNG形式に変換してください。"));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error("ファイルの読み込みに失敗しました"));
      };
      reader.readAsDataURL(file);
    });
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

      // HEIC形式の場合はエラーメッセージを表示（ブラウザで直接処理できないため）
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      
      if (fileType === "image/heic" || fileType === "image/heif" || fileName.endsWith(".heic") || fileName.endsWith(".heif")) {
        alert(`HEIC形式の画像は現在サポートされていません。\n\n【解決方法】\n1. iPhoneの場合: 設定 > カメラ > フォーマット > 「互換性優先」に変更してから写真を撮影\n2. または、写真アプリで画像を開き、「共有」>「写真を保存」でJPEG形式で保存\n3. または、JPEG/PNG形式の画像を使用してください\n\n現在のファイル: ${file.name}`);
        return;
      }
      
      let processedFile = file;

      // Vercelの制限（4.5MB）を考慮して、4MB以上の場合に自動圧縮
      const VERCEL_LIMIT = 4 * 1024 * 1024; // 4MB（安全マージン込み）
      const MAX_ORIGINAL_SIZE = 50 * 1024 * 1024; // 元のファイルサイズの上限50MB
      
      if (processedFile.size > MAX_ORIGINAL_SIZE) {
        alert(`ファイルサイズが大きすぎます（${Math.round(processedFile.size / 1024 / 1024)}MB）。最大50MBまで対応しています。`);
        return;
      }
      
      // 画像ファイルで4MBを超える場合は自動圧縮
      const isImage = fileType.startsWith("image/") && 
        (fileType === "image/jpeg" || fileType === "image/jpg" || fileType === "image/png" || 
         fileType === "image/gif" || fileType === "image/webp");
      
      if (isImage && processedFile.size > VERCEL_LIMIT) {
        console.log("Image size exceeds Vercel limit, compressing...", {
          originalSize: processedFile.size,
          limit: VERCEL_LIMIT,
        });
        try {
          processedFile = await compressImage(processedFile, 4);
          console.log("Image compressed successfully:", {
            originalSize: file.size,
            compressedSize: processedFile.size,
          });
        } catch (compressError: any) {
          console.error("Image compression error:", compressError);
          alert(`画像の圧縮に失敗しました。\n\nファイルサイズを小さくするか、画像の解像度を下げてから再度お試しください。\n\n現在のファイルサイズ: ${Math.round(file.size / 1024 / 1024)}MB`);
          return;
        }
      }
      
      // 最終的なサイズチェック（Vercelの制限）
      if (processedFile.size > VERCEL_LIMIT) {
        alert(`ファイルサイズが大きすぎます（${Math.round(processedFile.size / 1024 / 1024)}MB）。\n\nVercelの制限により、4MB以下のファイルのみアップロードできます。\n\n【解決方法】\n- 画像の解像度を下げる\n- 画像編集ソフトでファイルサイズを小さくする\n- 別の画像を試してください`);
        return;
      }

      // FormDataの作成と検証
      const formData = new FormData();
      formData.set("file", processedFile);
      
      // FormDataの内容を確認（デバッグ用）
      console.log("FormData created, file in FormData:", formData.get("file") ? "yes" : "no");
      
      let result: Awaited<ReturnType<typeof readReceiptImage>>;
      try {
        console.log("Calling Server Action...");
        
        // Server Action呼び出し（タイムアウト対策）
        const actionPromise = readReceiptImage(formData);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("サーバーからの応答がタイムアウトしました。ファイルサイズが大きすぎる可能性があります。")), 90000); // 90秒
        });
        
        result = await Promise.race([actionPromise, timeoutPromise]);
        console.log("Server Action completed successfully");
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

