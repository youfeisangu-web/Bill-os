"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState, useMemo } from "react";
import { convertQuotesToInvoices } from "@/app/actions/invoice";
import { updateQuoteFolder } from "@/app/actions/quote";
import ImportDocumentButton from "./import-document-button";
import { ChevronUp, ChevronDown, ChevronsUpDown, FolderOpen, X } from "lucide-react";

const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(
    typeof date === "string" ? new Date(date) : date,
  );

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value);

type QuoteRow = {
  id: string;
  quoteNumber: string;
  issueDate: Date | string;
  validUntil: Date | string;
  totalAmount: number;
  status: string;
  folder: string | null;
  client: { name: string | null } | null;
};

type SortKey = "quoteNumber" | "client" | "issueDate" | "validUntil" | "totalAmount" | "status";

const statusTone: Record<string, string> = {
  下書き: "text-slate-500",
  送付済: "text-blue-600",
  受注: "text-emerald-600",
  失注: "text-rose-600",
};

const statusBg: Record<string, string> = {
  下書き: "bg-slate-50",
  送付済: "bg-blue-50",
  受注: "bg-emerald-50",
  失注: "bg-rose-50",
};

const FOLDER_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-pink-50 text-pink-700 border-pink-200",
  "bg-orange-50 text-orange-700 border-orange-200",
  "bg-teal-50 text-teal-700 border-teal-200",
];

export default function QuotesTableWithBulkConvert({
  quotes,
}: {
  quotes: QuoteRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("issueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [folderInput, setFolderInput] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [activeFolderCardId, setActiveFolderCardId] = useState<string | null>(null);
  const [mobileFolderInput, setMobileFolderInput] = useState("");

  const folders = useMemo(
    () => Array.from(new Set(quotes.map((q) => q.folder).filter((f): f is string => !!f))),
    [quotes],
  );

  const filtered = useMemo(() => {
    if (folderFilter === null) return quotes;
    if (folderFilter === "__none__") return quotes.filter((q) => !q.folder);
    return quotes.filter((q) => q.folder === folderFilter);
  }, [quotes, folderFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "quoteNumber": cmp = a.quoteNumber.localeCompare(b.quoteNumber); break;
        case "client": cmp = (a.client?.name ?? "").localeCompare(b.client?.name ?? ""); break;
        case "issueDate": cmp = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime(); break;
        case "validUntil": cmp = new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime(); break;
        case "totalAmount": cmp = a.totalAmount - b.totalAmount; break;
        case "status": cmp = a.status.localeCompare(b.status); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown className="inline h-3 w-3 opacity-30 ml-0.5" />;
    return sortDir === "asc"
      ? <ChevronUp className="inline h-3 w-3 ml-0.5" />
      : <ChevronDown className="inline h-3 w-3 ml-0.5" />;
  };

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>('input[name="quote-select"]');
    checkboxes.forEach((cb) => { cb.checked = e.target.checked; });
  };

  const getSelectedIds = (): string[] => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>('input[name="quote-select"]:checked');
    return Array.from(checkboxes).map((cb) => cb.value);
  };

  const handleBulkConvert = () => {
    const allIds = getSelectedIds();
    const ids = allIds.filter((id) => sorted.find((q) => q.id === id)?.status !== "受注");
    if (ids.length === 0) { alert("変換できる見積書（受注以外）にチェックを入れてください。"); return; }
    if (!confirm(`選択した${ids.length}件の見積書を請求書に変換しますか？（見積書のステータスは「受注」になります）`)) return;
    startTransition(async () => {
      const result = await convertQuotesToInvoices(ids);
      if (!result.success) { alert(result.message); return; }
      alert(result.message);
      router.refresh();
    });
  };

  const handleBulkFolderAssign = () => {
    const ids = getSelectedIds();
    if (ids.length === 0) { alert("フォルダを設定する見積書にチェックを入れてください。"); return; }
    startTransition(async () => {
      await updateQuoteFolder(ids, folderInput.trim() || null);
      router.refresh();
      setFolderInput("");
      setShowFolderInput(false);
    });
  };

  const folderColor = (name: string) =>
    FOLDER_COLORS[Math.abs([...name].reduce((s, c) => s + c.charCodeAt(0), 0)) % FOLDER_COLORS.length];

  const assignFolderSingle = (id: string, folder: string | null) => {
    startTransition(async () => {
      await updateQuoteFolder([id], folder);
      router.refresh();
      setActiveFolderCardId(null);
      setMobileFolderInput("");
    });
  };

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <p className="billia-label mb-0.5">一覧</p>
          <p className="text-xs text-billia-text-muted hidden md:block">
            発行日・支払い期限・金額・ステータスを確認できます。チェックして一括で請求書に変換・フォルダ移動できます。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportDocumentButton />
          {quotes.some((q) => q.status !== "受注") && (
            <button
              type="button"
              onClick={handleBulkConvert}
              disabled={isPending}
              className="hidden md:inline-flex items-center rounded-xl bg-billia-green px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:opacity-50"
            >
              {isPending ? "変換中..." : "選択した見積を請求書に変換"}
            </button>
          )}
          <Link
            href="/dashboard/quotes/new?tab=memo"
            className="inline-flex rounded-xl border border-billia-blue bg-white px-3 py-2 text-xs font-medium text-billia-blue transition-colors hover:bg-billia-blue/5 md:px-4 md:py-2.5 md:text-sm"
          >
            メモから作成
          </Link>
          <Link
            href="/dashboard/quotes/new"
            className="inline-flex items-center rounded-xl bg-billia-sidebar px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-95 md:px-4 md:py-2.5 md:text-sm"
          >
            見積書を作成
          </Link>
        </div>
      </div>

      {/* フォルダフィルター */}
      {folders.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <FolderOpen className="h-3.5 w-3.5 text-billia-text-muted shrink-0" />
          <button
            type="button"
            onClick={() => setFolderFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              folderFilter === null
                ? "bg-billia-sidebar text-white border-billia-sidebar"
                : "bg-white text-billia-text-muted border-billia-border hover:bg-billia-bg"
            }`}
          >
            すべて ({quotes.length})
          </button>
          {folders.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFolderFilter(folderFilter === f ? null : f)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                folderFilter === f
                  ? "bg-billia-sidebar text-white border-billia-sidebar"
                  : `${folderColor(f)} hover:opacity-80`
              }`}
            >
              {f} ({quotes.filter((q) => q.folder === f).length})
            </button>
          ))}
          {quotes.some((q) => !q.folder) && (
            <button
              type="button"
              onClick={() => setFolderFilter(folderFilter === "__none__" ? null : "__none__")}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                folderFilter === "__none__"
                  ? "bg-billia-sidebar text-white border-billia-sidebar"
                  : "bg-white text-billia-text-muted border-billia-border hover:bg-billia-bg"
              }`}
            >
              未分類 ({quotes.filter((q) => !q.folder).length})
            </button>
          )}
        </div>
      )}

      {/* 一括操作バー（デスクトップのみ） */}
      {quotes.length > 0 && (
        <div className="mt-4 hidden md:flex flex-wrap items-center gap-3 rounded-lg border border-billia-border-subtle bg-billia-bg px-4 py-3">
          <span className="text-sm font-medium text-billia-text-muted">一括操作：</span>
          {showFolderInput ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleBulkFolderAssign(); if (e.key === "Escape") setShowFolderInput(false); }}
                placeholder="フォルダ名（空にすると解除）"
                list="folder-suggestions-quote"
                autoFocus
                className="rounded-lg border border-billia-border bg-white px-3 py-2 text-sm text-billia-text w-52"
              />
              <datalist id="folder-suggestions-quote">
                {folders.map((f) => <option key={f} value={f} />)}
              </datalist>
              <button
                type="button"
                onClick={handleBulkFolderAssign}
                disabled={isPending}
                className="inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                設定
              </button>
              <button type="button" onClick={() => setShowFolderInput(false)} className="p-2 text-billia-text-muted hover:text-billia-text">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowFolderInput(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-billia-border bg-white px-4 py-2.5 text-sm font-medium text-billia-text hover:bg-billia-bg"
            >
              <FolderOpen className="h-4 w-4" />
              フォルダに移動
            </button>
          )}
        </div>
      )}

      {/* モバイル：並び替えコントロール */}
      <div className="mt-3 flex items-center gap-2 md:hidden">
        <span className="text-xs text-billia-text-muted shrink-0">並び替え:</span>
        <select
          value={`${sortKey}_${sortDir}`}
          onChange={(e) => {
            const [k, d] = e.target.value.split("_");
            setSortKey(k as SortKey);
            setSortDir(d as "asc" | "desc");
          }}
          className="flex-1 text-xs rounded-xl border border-billia-border bg-white px-3 py-2 text-billia-text"
        >
          <option value="issueDate_desc">発行日（新しい順）</option>
          <option value="issueDate_asc">発行日（古い順）</option>
          <option value="validUntil_asc">有効期限（近い順）</option>
          <option value="totalAmount_desc">金額（高い順）</option>
          <option value="totalAmount_asc">金額（低い順）</option>
          <option value="client_asc">取引先名順</option>
          <option value="status_asc">ステータス順</option>
        </select>
      </div>

      {/* モバイル：カード表示 */}
      <div className="mt-3 space-y-2 md:hidden">
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-billia-text-muted">
            {folderFilter ? "このフォルダに見積書がありません。" : "まだ見積書が登録されていません。作成ボタンから追加してください。"}
          </p>
        ) : (
          sorted.map((quote) => (
            <div key={quote.id} className="relative rounded-xl border border-billia-border-subtle bg-white">
              <Link
                href={`/dashboard/quotes/${quote.id}`}
                className="block p-4 pr-12 hover:bg-billia-bg transition-colors rounded-xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-billia-blue truncate">{quote.quoteNumber}</p>
                    <p className="text-sm text-billia-text mt-0.5 truncate">{quote.client?.name ?? "-"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusTone[quote.status] ?? "text-billia-text-muted"} ${statusBg[quote.status] ?? "bg-gray-50"}`}>
                      {quote.status}
                    </span>
                    {quote.folder && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${folderColor(quote.folder)}`}>{quote.folder}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  <p className="text-xs text-billia-text-muted">{formatDate(quote.issueDate)} 〜 {formatDate(quote.validUntil)}</p>
                  <p className="text-sm font-semibold text-billia-text">¥{formatCurrency(quote.totalAmount)}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => { setActiveFolderCardId(activeFolderCardId === quote.id ? null : quote.id); setMobileFolderInput(""); }}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-billia-text-muted hover:bg-billia-bg hover:text-billia-blue transition-colors"
                aria-label="フォルダを設定"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
              {activeFolderCardId === quote.id && (
                <div className="border-t border-billia-border-subtle px-4 py-3 space-y-2">
                  <p className="text-xs font-medium text-billia-text-muted">フォルダを選択</p>
                  <div className="flex flex-wrap gap-1.5">
                    {folders.map((f) => (
                      <button key={f} type="button" onClick={() => assignFolderSingle(quote.id, f)} disabled={isPending}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${quote.folder === f ? "bg-billia-sidebar text-white border-billia-sidebar" : `${folderColor(f)} hover:opacity-80`}`}>
                        {f}
                      </button>
                    ))}
                    {quote.folder && (
                      <button type="button" onClick={() => assignFolderSingle(quote.id, null)} disabled={isPending}
                        className="text-xs px-2.5 py-1 rounded-full border border-red-200 bg-red-50 text-red-600 hover:opacity-80">
                        解除
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={mobileFolderInput}
                      onChange={(e) => setMobileFolderInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && mobileFolderInput.trim()) assignFolderSingle(quote.id, mobileFolderInput.trim()); }}
                      placeholder="新しいフォルダ名"
                      list="folder-suggestions-quote-mobile"
                      className="flex-1 text-xs rounded-lg border border-billia-border bg-white px-2.5 py-1.5 text-billia-text"
                    />
                    <datalist id="folder-suggestions-quote-mobile">
                      {folders.map((f) => <option key={f} value={f} />)}
                    </datalist>
                    <button type="button" onClick={() => { if (mobileFolderInput.trim()) assignFolderSingle(quote.id, mobileFolderInput.trim()); }} disabled={isPending || !mobileFolderInput.trim()}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-40">
                      設定
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* デスクトップ：テーブル表示 */}
      <div className="mt-6 hidden overflow-hidden rounded-xl border border-billia-border-subtle md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-billia-bg billia-label">
            <tr>
              <th className="w-10 px-4 py-3">
                {sorted.length > 0 ? (
                  <input type="checkbox" aria-label="すべて選択" onChange={handleToggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                ) : null}
              </th>
              <th className="px-4 py-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("quoteNumber")}>
                見積番号 <SortIcon k="quoteNumber" />
              </th>
              <th className="px-4 py-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("client")}>
                取引先名 <SortIcon k="client" />
              </th>
              <th className="px-4 py-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("issueDate")}>
                発行日 <SortIcon k="issueDate" />
              </th>
              <th className="px-4 py-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("validUntil")}>
                有効期限 <SortIcon k="validUntil" />
              </th>
              <th className="px-4 py-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("totalAmount")}>
                金額 (円) <SortIcon k="totalAmount" />
              </th>
              <th className="px-4 py-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("status")}>
                ステータス <SortIcon k="status" />
              </th>
              <th className="px-4 py-3">フォルダ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-billia-border-subtle">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-billia-text-muted">
                  {folderFilter ? "このフォルダに見積書がありません。" : "まだ見積書が登録されていません。作成ボタンから追加してください。"}
                </td>
              </tr>
            ) : (
              sorted.map((quote) => (
                <tr key={quote.id} className="text-billia-text-muted hover:bg-billia-bg/40">
                  <td className="px-4 py-4">
                    <input name="quote-select" type="checkbox" value={quote.id}
                      aria-label={`${quote.quoteNumber} を選択`}
                      className="h-4 w-4 rounded border-stone-300 text-billia-green focus:ring-billia-green" />
                  </td>
                  <td className="px-4 py-4 font-medium text-billia-blue">
                    <Link href={`/dashboard/quotes/${quote.id}`}>{quote.quoteNumber}</Link>
                  </td>
                  <td className="px-4 py-4">{quote.client?.name ?? "-"}</td>
                  <td className="px-4 py-4">{formatDate(quote.issueDate)}</td>
                  <td className="px-4 py-4">{formatDate(quote.validUntil)}</td>
                  <td className="px-4 py-4">¥{formatCurrency(quote.totalAmount)}</td>
                  <td className="px-4 py-4">
                    <span className={`font-medium ${statusTone[quote.status] ?? "text-billia-text-muted"}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {quote.folder ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${folderColor(quote.folder)}`}>
                        {quote.folder}
                      </span>
                    ) : (
                      <span className="text-billia-text-muted text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
