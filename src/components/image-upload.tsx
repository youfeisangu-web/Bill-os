"use client";

import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

type ImageUploadProps = {
  userId: string;
  currentUrl?: string | null;
  onChange: (url: string | null) => void;
  label: string;
  bucket: string;
};

export default function ImageUpload({
  userId,
  currentUrl,
  onChange,
  label,
  bucket,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルタイプの検証
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      window.alert("画像ファイル（JPEG、PNG、GIF、WebP）を選択してください。");
      return;
    }

    // ファイル拡張子の検証（MIMEタイプだけでは不十分な場合に備えて）
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    if (!allowedExtensions.includes(fileExtension)) {
      window.alert("画像ファイル（JPEG、PNG、GIF、WebP）を選択してください。");
      return;
    }

    // ファイルサイズの検証（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      window.alert("ファイルサイズは5MB以下にしてください。");
      return;
    }

    // ファイル名の検証（パストラバーサル攻撃対策）
    if (file.name.includes("..") || file.name.includes("/") || file.name.includes("\\")) {
      window.alert("無効なファイル名です。");
      return;
    }

    setUploading(true);

    try {
      // ファイル名を生成: company-assets/${userId}/${timestamp}-${sanitizedFilename}
      const timestamp = Date.now();
      // ファイル名をサニタイズ（危険な文字を除去）
      const sanitizedFilename = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .substring(0, 100); // ファイル名の長さ制限
      const fileName = `${userId}/${timestamp}-${sanitizedFilename}`;

      // Supabase Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Public URLを取得
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName);

      setPreview(publicUrl);
      onChange(publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      window.alert(
        error instanceof Error
          ? `アップロードエラー: ${error.message}`
          : "画像のアップロードに失敗しました。"
      );
    } finally {
      setUploading(false);
      // ファイル入力のリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    if (!currentUrl) {
      setPreview(null);
      onChange(null);
      return;
    }

    // URLからファイルパスを抽出
    try {
      const url = new URL(currentUrl);
      const pathParts = url.pathname.split("/");
      const bucketIndex = pathParts.findIndex((part) => part === bucket);
      if (bucketIndex !== -1) {
        const fileName = pathParts.slice(bucketIndex + 1).join("/");
        await supabase.storage.from(bucket).remove([fileName]);
      }
    } catch (error) {
      console.error("Error removing image:", error);
    }

    setPreview(null);
    onChange(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelect({
        target: { files: dataTransfer.files },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt={label}
              className="mx-auto max-h-48 rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
              aria-label="画像を削除"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="rounded-full bg-slate-200 p-3 dark:bg-slate-700">
              {uploading ? (
                <Upload className="h-6 w-6 animate-pulse text-slate-500" />
              ) : (
                <ImageIcon className="h-6 w-6 text-slate-500" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {uploading ? "アップロード中..." : "画像をドラッグ＆ドロップ"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                またはクリックしてファイルを選択
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            {!uploading && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                ファイルを選択
              </button>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        推奨: PNG、JPG形式、5MB以下
      </p>
    </div>
  );
}
