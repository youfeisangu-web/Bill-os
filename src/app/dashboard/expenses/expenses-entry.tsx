"use client";

import { useState, useRef } from "react";
import { readReceiptImage } from "@/app/actions/ocr-receipt";
import { parseMemoToExpense } from "@/app/actions/memo-parser";
import {
  Loader2,
  UploadCloud,
  AlertCircle,
  Sparkles,
  PenLine,
  Camera,
} from "lucide-react";
import NewExpenseDialog from "./new-expense-dialog";
import type { ExpenseInitialValues } from "./new-expense-dialog";
import type { ReceiptOCRData } from "@/app/actions/ocr-receipt";

function receiptToInitialValues(data: ReceiptOCRData): ExpenseInitialValues {
  return {
    title: data.title,
    amount: data.amount,
    date: data.date,
    category: data.category,
  };
}

const compressImage = async (
  file: File,
  maxSizeMB: number = 3.5,
): Promise<File> => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size <= maxSizeBytes) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
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
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const tryCompress = (q: number) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("圧縮に失敗しました"));
              return;
            }
            if (blob.size > maxSizeBytes && q > 0.3) {
              tryCompress(q - 0.1);
            } else {
              resolve(
                new File(
                  [blob],
                  file.name.replace(/\.(png|gif|webp)$/i, ".jpg"),
                  { type: "image/jpeg", lastModified: file.lastModified },
                ),
              );
            }
          }, "image/jpeg", q);
        };
        tryCompress(0.7);
      };
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });
};

export default function ExpensesEntry() {
  const [isScanning, setIsScanning] = useState(false);
  const [isMemoLoading, setIsMemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialValues, setInitialValues] =
    useState<ExpenseInitialValues | null>(null);
  const [memo, setMemo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    try {
      const MAX_SIZE = 4 * 1024 * 1024;
      let processedFile = file;

      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      const isHeic =
        fileType === "image/heic" ||
        fileType === "image/heif" ||
        fileName.endsWith(".heic") ||
        fileName.endsWith(".heif");

      if (isHeic) {
        try {
          const heic2any = (await import("heic2any")).default;
          const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.9,
          });
          const blob = Array.isArray(convertedBlob)
            ? convertedBlob[0]
            : convertedBlob;
          processedFile = new File(
            [blob],
            file.name.replace(/\.(heic|heif)$/i, ".jpg"),
            { type: "image/jpeg", lastModified: file.lastModified },
          );
        } catch (heicError: unknown) {
          const msg =
            heicError instanceof Error ? heicError.message : String(heicError);
          setError(`HEIC変換エラー: ${msg}`);
          setIsScanning(false);
          return;
        }
      }

      if (processedFile.type.startsWith("image/") && processedFile.size > MAX_SIZE) {
        try {
          processedFile = await compressImage(processedFile, 3.5);
        } catch (compressError: unknown) {
          const msg =
            compressError instanceof Error
              ? compressError.message
              : String(compressError);
          setError(`圧縮エラー: ${msg}`);
          setIsScanning(false);
          return;
        }
      }

      if (processedFile.size > MAX_SIZE) {
        setError(
          `ファイルサイズが大きすぎます（${Math.round(processedFile.size / 1024 / 1024)}MB）。3MB以下にしてください。`,
        );
        setIsScanning(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", processedFile);
      const fileInFormData = formData.get("file") as File | null;
      if (!fileInFormData || fileInFormData.size === 0) {
        setError("ファイルの読み込みに失敗しました。再度お試しください。");
        setIsScanning(false);
        return;
      }

      let result;
      try {
        result = await readReceiptImage(formData);
      } catch (serverError: unknown) {
        const msg =
          serverError instanceof Error ? serverError.message : String(serverError);
        if (msg.includes("400") || msg.includes("Bad Request")) {
          setError(
            `リクエストエラー（400）。ファイル形式: ${processedFile.type || "不明"}`,
          );
          setIsScanning(false);
          return;
        }
        throw serverError;
      }

      if (result.success && result.data) {
        setInitialValues(receiptToInitialValues(result.data));
        setDialogOpen(true);
      } else {
        setError(
          result.message || "読み取りに失敗しました。もう一度お試しください。",
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "もう一度お試しください。";
      setError(`エラー: ${msg}`);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMemoSubmit = async () => {
    if (!memo.trim()) return;
    setIsMemoLoading(true);
    setError(null);
    try {
      const result = await parseMemoToExpense(memo.trim());
      if (result.success && result.data) {
        setInitialValues(result.data);
        setDialogOpen(true);
        setMemo("");
      } else {
        setError(
          result.message ||
            "解析できませんでした。もう少し詳しく書いてみてください。",
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "解析に失敗しました。";
      setError(`エラー: ${msg}`);
    } finally {
      setIsMemoLoading(false);
    }
  };

  const handleManual = () => {
    setInitialValues(null);
    setError(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-start gap-2 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ① 領収書をスキャン */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Camera className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">
            領収書をスキャン
          </span>
          <span className="text-xs text-gray-400 ml-1">AIが自動で読み取り</span>
        </div>
        <div
          className="p-4 md:p-6 text-center cursor-pointer hover:bg-indigo-50 transition"
          onClick={() => {
            if (!isScanning) fileInputRef.current?.click();
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
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm font-medium text-indigo-700">AIが解析中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                <UploadCloud className="w-6 h-6 text-indigo-500" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                タップして領収書を選択
              </p>
              <p className="text-xs text-gray-400">JPG / PNG / HEIC / PDF 対応</p>
            </div>
          )}
        </div>
      </div>

      {/* ② メモから作成 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-gray-800">メモから作成</span>
          <span className="text-xs text-gray-400 ml-1">話し言葉でOK</span>
        </div>
        <div className="p-4 space-y-3">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={
              "例: 昨日コンビニで500円のお菓子\n例: 電車代1,200円\n例: AWS 3月分 15,000円"
            }
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                handleMemoSubmit();
            }}
          />
          <button
            onClick={handleMemoSubmit}
            disabled={isMemoLoading || !memo.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-40"
          >
            {isMemoLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                解析中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AIで解析して登録
              </>
            )}
          </button>
        </div>
      </div>

      {/* ③ 手動入力 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <PenLine className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-800">手動で入力</span>
        </div>
        <div className="p-4">
          <button
            onClick={handleManual}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <PenLine className="w-4 h-4" />
            フォームを開く
          </button>
        </div>
      </div>

      <NewExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialValues={initialValues}
      />
    </div>
  );
}
