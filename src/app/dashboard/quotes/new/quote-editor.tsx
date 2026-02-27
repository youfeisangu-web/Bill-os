"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createQuote } from "@/app/actions/quote";
import { normalizeToHalfWidthNumeric, calcTaxAmount, type TaxRounding } from "@/lib/utils";
import type { DocumentImportData } from "@/app/actions/ocr-document";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { parseMemoToQuote } from "@/app/actions/memo-parser";
import { Loader2 } from "lucide-react";

const QUOTE_OCR_STORAGE_KEY = "quoteOcrPrefill";

type ClientOption = {
  id: string;
  name: string;
};

type ItemRow = {
  name: string;
  quantity: string;
  unitPrice: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value);

/** 今日の日付を YYYY-MM-DD で返す */
function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 翌月末の日付を YYYY-MM-DD で返す */
function endOfNextMonthString() {
  const d = new Date();
  const end = new Date(d.getFullYear(), d.getMonth() + 2, 0);
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
}

type QuoteEditorProps = {
  clients: ClientOption[];
  taxRate?: number;
  taxRounding?: string;
};

export default function QuoteEditor({ clients, taxRate = 10, taxRounding = "floor" }: QuoteEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isNewClient, setIsNewClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [items, setItems] = useState<ItemRow[]>([
    { name: "", quantity: "1", unitPrice: "0" },
  ]);
  const defaultIssueDate = useMemo(() => todayString(), []);
  const defaultValidUntil = useMemo(() => endOfNextMonthString(), []);
  const [issueDate, setIssueDate] = useState(defaultIssueDate);
  const [validUntil, setValidUntil] = useState(defaultValidUntil);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [memoText, setMemoText] = useState("");
  const [isParsingMemo, setIsParsingMemo] = useState(false);
  const [memoError, setMemoError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "memo" ? "memo" : "form");
  const fromOcr = searchParams.get("fromOcr") === "1";

  useEffect(() => {
    if (searchParams.get("fromOcr") !== "1") return;
    try {
      const raw = sessionStorage.getItem(QUOTE_OCR_STORAGE_KEY);
      if (!raw) return;
      const prefill = JSON.parse(raw) as DocumentImportData;
      sessionStorage.removeItem(QUOTE_OCR_STORAGE_KEY);
      setIsNewClient(true);
      setClientName(prefill.clientName ?? "");
      setClientEmail(prefill.clientEmail ?? "");
      setClientAddress(prefill.clientAddress ?? "");
      setIssueDate(prefill.issueDate ?? defaultIssueDate);
      setValidUntil(prefill.validUntil ?? defaultValidUntil);
      if (prefill.items?.length) {
        setItems(
          prefill.items.map((i) => ({
            name: i.name,
            quantity: String(i.quantity),
            unitPrice: String(i.unitPrice),
          })),
        );
      }
    } catch {
      // ignore
    }
  }, [searchParams, defaultIssueDate, defaultValidUntil]);

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) =>
        sum +
        (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
      0,
    );
    const taxAmount = calcTaxAmount(subtotal, taxRate, taxRounding as TaxRounding);
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  }, [items, taxRate, taxRounding]);

  const updateItem = (index: number, key: keyof ItemRow, value: string) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (key === "name") {
          return { ...item, name: value };
        }
        const normalized = normalizeToHalfWidthNumeric(value);
        const match = normalized.match(/^\d*\.?\d*/);
        const cleaned = value === "" ? "" : match ? match[0] : "";
        return { ...item, [key]: cleaned };
      }),
    );
  };

  const handleAddRow = () => {
    setItems((prev) => [...prev, { name: "", quantity: "1", unitPrice: "0" }]);
  };

  const handleRemoveRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleParseMemo = async () => {
    if (!memoText.trim()) {
      setMemoError("メモテキストを入力してください");
      return;
    }

    setIsParsingMemo(true);
    setMemoError(null);

    try {
      const result = await parseMemoToQuote(memoText);
      if (result.success && result.data) {
        const parsedName = result.data.clientName.trim();
        const matched = clients.find(
          (c) =>
            c.name.trim() === parsedName ||
            c.name.trim().replace(/\s+/g, "") === parsedName.replace(/\s+/g, "")
        );
        if (matched) {
          setIsNewClient(false);
          setSelectedClientId(matched.id);
          setClientName("");
          setClientEmail("");
          setClientAddress("");
        } else {
          setIsNewClient(true);
          setSelectedClientId("");
          setClientName(result.data.clientName);
          setClientEmail(result.data.clientEmail || "");
          setClientAddress(result.data.clientAddress || "");
        }
        setIssueDate(result.data.issueDate || defaultIssueDate);
        setValidUntil(result.data.validUntil || defaultValidUntil);
        if (result.data.items && result.data.items.length > 0) {
          setItems(
            result.data.items.map((i) => ({
              name: i.name,
              quantity: String(i.quantity),
              unitPrice: String(i.unitPrice),
            }))
          );
        }
        setMemoText("");
        setMemoError(null);
        setActiveTab("form");
      } else {
        setMemoError(result.message || "解析に失敗しました");
      }
    } catch (error: any) {
      setMemoError(error?.message || "解析中にエラーが発生しました");
    } finally {
      setIsParsingMemo(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("items", JSON.stringify(items));

    startTransition(async () => {
      const result = await createQuote(formData);
      if (result && !result.success) {
        window.alert(result.message);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">見積書</p>
            <h1 className="text-2xl font-semibold text-slate-900">新規作成</h1>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isPending ? "保存中..." : "保存する"}
          </button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="form">通常入力</TabsTrigger>
            <TabsTrigger value="memo">メモから作成</TabsTrigger>
          </TabsList>

          <TabsContent value="memo" className="space-y-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <p className="text-sm text-blue-800 mb-3">
                <strong>メモ形式で入力してください。</strong> 話し言葉でもOKです。Gemini（AI）が解析してフォームに入力します。取引先に同じ名前があれば、その取引先宛の見積書として紐づきます。
              </p>
              <p className="text-xs text-blue-700 mb-4">
                例: 「株式会社XYZに、ウェブサイト制作見積もり、50万円で提案して」<br />
                例: 「田中さん、アプリ開発の見積もり、開発費100万、保守費月5万、3ヶ月分」
              </p>
              <textarea
                value={memoText}
                onChange={(e) => {
                  setMemoText(e.target.value);
                  setMemoError(null);
                }}
                placeholder="メモを入力してください..."
                className="w-full min-h-[200px] rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              {memoError && (
                <p className="mt-2 text-sm text-red-600">{memoError}</p>
              )}
              <button
                type="button"
                onClick={handleParseMemo}
                disabled={isParsingMemo || !memoText.trim()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isParsingMemo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    解析中...
                  </>
                ) : (
                  "解析してフォームに入力"
                )}
              </button>
            </div>
          </TabsContent>

          <TabsContent value="form" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                取引先
              </label>
              <div className="flex gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="clientMode"
                    checked={!isNewClient}
                    onChange={() => setIsNewClient(false)}
                    className="cursor-pointer"
                  />
                  <span>既存から選択</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="clientMode"
                    checked={isNewClient}
                    onChange={() => setIsNewClient(true)}
                    className="cursor-pointer"
                  />
                  <span>新規入力</span>
                </label>
              </div>
            </div>
            {!isNewClient ? (
              <select
                name="clientId"
                required={!isNewClient}
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">選択してください</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-3">
                <input
                  name="clientName"
                  type="text"
                  placeholder="取引先名（必須）"
                  required={isNewClient}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  name="clientEmail"
                  type="email"
                  placeholder="メールアドレス（任意）"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  name="clientAddress"
                  type="text"
                  placeholder="住所（任意）"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                発行日
              </label>
              <input
                name="issueDate"
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                有効期限
              </label>
              <input
                name="validUntil"
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">明細</h2>
            <button
              type="button"
              onClick={handleAddRow}
              className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              行を追加
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[2fr_1fr_1fr_auto]"
              >
                <input
                  type="text"
                  placeholder="項目名"
                  value={item.name}
                  onChange={(event) => updateItem(index, "name", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="数量"
                  value={item.quantity}
                  onChange={(event) => updateItem(index, "quantity", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="金額"
                  value={item.unitPrice}
                  onChange={(event) => updateItem(index, "unitPrice", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
                  <span>
                    ¥
                    {formatCurrency(
                      (parseFloat(item.quantity) || 0) *
                        (parseFloat(item.unitPrice) || 0),
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    disabled={items.length === 1}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 transition hover:bg-white disabled:cursor-not-allowed"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-end gap-2 text-sm text-slate-600">
            <div className="flex w-full max-w-xs items-center justify-between">
              <span>小計</span>
              <span>¥{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex w-full max-w-xs items-center justify-between">
              <span>消費税 (10%)</span>
              <span>¥{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="mt-2 flex w-full max-w-xs items-center justify-between text-base font-semibold text-slate-900">
              <span>合計</span>
              <span className="text-xl">¥{formatCurrency(totals.totalAmount)}</span>
            </div>
          </div>
        </div>
          </TabsContent>
        </Tabs>
      </section>
    </form>
  );
}
