"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { savePayment, getReconcileSummary } from "@/app/actions/payment";
import type { ReconcileResult } from "@/types/reconcile";
import { Upload } from "lucide-react";

type Summary = { totalBilledAmount: number; invoiceCount: number };

export default function ReconcileClient({
  initialSummary,
}: {
  initialSummary: Summary;
}) {
  const [summary, setSummary] = useState<Summary>(initialSummary);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<ReconcileResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const s = await getReconcileSummary();
      setSummary(s);
    } catch {
      // ignore
    }
  }, []);

  const parseFile = useCallback(async (f: File) => {
    setFile(f);
    setResults([]);
    setExecuted(false);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", f);
      const res = await fetch("/api/reconcile", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) {
        setResults(json.data ?? []);
      } else {
        alert("エラー: " + (json.error ?? "ファイルの読み込みに失敗しました"));
      }
    } catch (e) {
      alert("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f && (f.name.endsWith(".csv") || f.type === "text/csv" || f.type === "application/vnd.ms-excel")) {
        parseFile(f);
      } else {
        alert("CSVファイルのみ読み込めます");
      }
    },
    [parseFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) parseFile(f);
      e.target.value = "";
    },
    [parseFile],
  );

  const completableRows = results.filter(
    (r) => r.status === "完了" && r.tenantId && r.date,
  );

  const handleExecute = async () => {
    if (completableRows.length === 0) {
      alert("消し込みできる行がありません（判定が「完了」の行のみ登録されます）");
      return;
    }
    setConfirming(true);
    const ok = window.confirm(
      `以下の${completableRows.length}件の入金を登録します。よろしいですか？`,
    );
    setConfirming(false);
    if (!ok) return;

    setLoading(true);
    let done = 0;
    try {
      for (const row of completableRows) {
        if (row.tenantId && row.date) {
          await savePayment(row.tenantId, row.amount, row.date);
          done += 1;
        }
      }
      setExecuted(true);
      await loadSummary();
      alert(`${done}件の入金を登録しました。`);
    } catch (err) {
      alert(
        "登録に失敗しました: " +
          (err instanceof Error ? err.message : "不明なエラー"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setResults([]);
    setExecuted(false);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 請求金額（請求書発行済みの未回収） */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          請求金額（未回収）
        </h2>
        <p className="mt-2 text-3xl font-bold text-slate-900">
          ¥{summary.totalBilledAmount.toLocaleString()}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          請求書発行済みの未払い・部分払い 計{summary.invoiceCount}件
        </p>
        <Link
          href="/dashboard/invoices"
          className="mt-3 inline-block text-sm text-blue-600 hover:underline"
        >
          請求書一覧はこちら →
        </Link>
      </section>

      {/* ファイルドロップ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          入金消し込み（CSV読み込み）
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          銀行の入金明細CSVをドロップするか、選択して読み込みます。内容を確認してから「消し込みを実行」で入金を登録してください。
        </p>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 px-6 transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
          }`}
        >
          <input
            type="file"
            accept=".csv,text/csv,application/vnd.ms-excel"
            onChange={handleFileInput}
            className="hidden"
            id="reconcile-file"
          />
          <label
            htmlFor="reconcile-file"
            className="flex cursor-pointer flex-col items-center gap-2 text-slate-600"
          >
            <Upload className="h-10 w-10 text-slate-400" />
            <span className="font-medium">
              {file ? file.name : "CSVをドロップまたはクリックして選択"}
            </span>
            <span className="text-xs text-slate-500">CSVのみ（Shift_JIS対応）</span>
          </label>
        </div>
        {loading && (
          <p className="mt-4 text-center text-sm text-slate-500">読み込み・解析中...</p>
        )}
      </section>

      {/* 消込結果と確認 */}
      {results.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">消込結果（確認）</h2>
            <p className="text-sm text-slate-600 mt-1">
              以下の内容で問題なければ「消し込みを実行」を押して入金を登録してください。
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">日付</th>
                  <th className="px-4 py-3 font-medium">入金名義 (CSV)</th>
                  <th className="px-4 py-3 font-medium">金額</th>
                  <th className="px-4 py-3 font-medium">判定</th>
                  <th className="px-4 py-3 font-medium">コメント</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {results.map((row, i) => (
                  <tr key={i} className="bg-white">
                    <td className="px-4 py-3 text-slate-700">{row.date}</td>
                    <td className="px-4 py-3 font-mono text-slate-800">{row.rawName}</td>
                    <td className="px-4 py-3 text-slate-800">
                      ¥{row.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          row.status === "完了"
                            ? "bg-emerald-100 text-emerald-800"
                            : row.status === "エラー"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <p className="text-sm text-slate-600">
              {completableRows.length}件を登録できます
              {executed && "（登録済み）"}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                クリア
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={loading || confirming || completableRows.length === 0 || executed}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "登録中..." : executed ? "登録済み" : "消し込みを実行"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
