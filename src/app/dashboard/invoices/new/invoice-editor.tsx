"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { InvoiceOCRData } from "@/app/actions/ocr-document";

const INVOICE_OCR_STORAGE_KEY = "invoiceOcrPrefill";
import { createInvoice } from "@/app/actions/invoice";
import { normalizeToHalfWidthNumeric, calcTaxAmount, type TaxRounding } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { parseMemoToInvoice } from "@/app/actions/memo-parser";
import { Loader2 } from "lucide-react";

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

/** 当月末の日付を YYYY-MM-DD で返す */
function endOfCurrentMonthString() {
  const d = new Date();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
}

/** 翌月の指定日の日付を YYYY-MM-DD で返す */
function nthOfNextMonthString(day: number) {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth() + 1, Math.min(day, new Date(d.getFullYear(), d.getMonth() + 2, 0).getDate()));
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

/** 今日から days 日後の日付を YYYY-MM-DD で返す */
function daysAfterString(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type DefaultPaymentTermType =
  | "end_of_next_month"
  | "10th_of_next_month"
  | "20th_of_next_month"
  | "days_after_issue";

function getDefaultDates(
  term: DefaultPaymentTermType,
  daysAfterIssue: number
): { issueDate: string; dueDate: string } {
  switch (term) {
    case "end_of_next_month":
      return {
        issueDate: endOfCurrentMonthString(),
        dueDate: endOfNextMonthString(),
      };
    case "10th_of_next_month":
      return {
        issueDate: endOfCurrentMonthString(),
        dueDate: nthOfNextMonthString(10),
      };
    case "20th_of_next_month":
      return {
        issueDate: endOfCurrentMonthString(),
        dueDate: nthOfNextMonthString(20),
      };
    case "days_after_issue":
      return {
        issueDate: todayString(),
        dueDate: daysAfterString(daysAfterIssue),
      };
    default:
      return {
        issueDate: endOfCurrentMonthString(),
        dueDate: endOfNextMonthString(),
      };
  }
}

/** 日付を YYYY-MM-DD で返す */
function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 頻度・請求日から直近の次回作成日を計算 */
function getNextOccurrenceDate(
  frequency: string,
  billingDay: string,
): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (frequency === "毎週") {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return toDateString(d);
  }
  if (frequency === "毎年") {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() + 1);
    return toDateString(d);
  }

  // 毎月
  const isEndOfMonth = billingDay === "月末";
  const dayNum = isEndOfMonth
    ? 31
    : parseInt(billingDay.replace("日", ""), 10);

  const thisMonthLast = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const targetDay = isEndOfMonth
    ? thisMonthLast.getDate()
    : Math.min(dayNum, thisMonthLast.getDate());
  let next = new Date(now.getFullYear(), now.getMonth(), targetDay);

  if (next <= now) {
    const nextMonthLast = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const nextTargetDay = isEndOfMonth
      ? nextMonthLast.getDate()
      : Math.min(dayNum, nextMonthLast.getDate());
    next = new Date(now.getFullYear(), now.getMonth() + 1, nextTargetDay);
  }
  return toDateString(next);
}

const RECURRING_FREQUENCIES = [
  { value: "毎月", label: "毎月" },
  { value: "毎週", label: "毎週" },
  { value: "毎年", label: "毎年" },
] as const;

const BILLING_DAYS = [
  { value: "月末", label: "月末" },
  { value: "25日", label: "25日" },
  { value: "20日", label: "20日" },
  { value: "15日", label: "15日" },
  { value: "10日", label: "10日" },
  { value: "5日", label: "5日" },
] as const;

type InvoiceEditorProps = {
  clients: ClientOption[];
  defaultPaymentTerm?: DefaultPaymentTermType;
  defaultPaymentTermsDays?: number;
  taxRate?: number;
  taxRounding?: string;
};

export default function InvoiceEditor({
  clients,
  defaultPaymentTerm = "end_of_next_month",
  defaultPaymentTermsDays = 30,
  taxRate = 10,
  taxRounding = "floor",
}: InvoiceEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isNewClient, setIsNewClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [items, setItems] = useState<ItemRow[]>([
    { name: "", quantity: "1", unitPrice: "0" },
  ]);
  const { issueDate: defaultIssueDate, dueDate: defaultDueDate } = useMemo(
    () =>
      getDefaultDates(
        defaultPaymentTerm as DefaultPaymentTermType,
        defaultPaymentTerm === "days_after_issue" ? 14 : defaultPaymentTermsDays
      ),
    [defaultPaymentTerm, defaultPaymentTermsDays]
  );

  const [issueDate, setIssueDate] = useState(defaultIssueDate);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [customMarkupPercent, setCustomMarkupPercent] = useState("");
  const [memoText, setMemoText] = useState("");
  const [isParsingMemo, setIsParsingMemo] = useState(false);
  const [memoError, setMemoError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "memo" ? "memo" : "form");
  const fromOcr = searchParams.get("fromOcr") === "1";

  useEffect(() => {
    if (searchParams.get("fromOcr") !== "1") return;
    try {
      const raw = sessionStorage.getItem(INVOICE_OCR_STORAGE_KEY);
      if (!raw) return;
      const prefill = JSON.parse(raw) as InvoiceOCRData;
      sessionStorage.removeItem(INVOICE_OCR_STORAGE_KEY);
      setIsNewClient(true);
      setClientName(prefill.clientName ?? "");
      setClientEmail(prefill.clientEmail ?? "");
      setClientAddress(prefill.clientAddress ?? "");
      setIssueDate(prefill.issueDate ?? defaultIssueDate);
      setDueDate(prefill.dueDate ?? defaultDueDate);
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
  }, [searchParams, defaultIssueDate, defaultDueDate]);

  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<string>("毎月");
  const [billingDay, setBillingDay] = useState<string>("月末");
  const [nextDate, setNextDate] = useState<string>(() =>
    getNextOccurrenceDate("毎月", "月末"),
  );

  useEffect(() => {
    if (isRecurring) {
      setNextDate(getNextOccurrenceDate(frequency, billingDay));
    }
  }, [frequency, billingDay, isRecurring]);

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

  /** 単価に割り増し率（%）を適用して明細を更新 */
  const applyMarkup = (ratePercent: number) => {
    if (ratePercent <= 0) return;
    setItems((prev) =>
      prev.map((item) => {
        const current = parseFloat(item.unitPrice) || 0;
        const newPrice = Math.round(current * (1 + ratePercent / 100));
        return { ...item, unitPrice: String(newPrice) };
      }),
    );
    setCustomMarkupPercent("");
  };

  const handleParseMemo = async () => {
    if (!memoText.trim()) {
      setMemoError("メモテキストを入力してください");
      return;
    }

    setIsParsingMemo(true);
    setMemoError(null);

    try {
      const result = await parseMemoToInvoice(memoText);
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
        setDueDate(result.data.dueDate || defaultDueDate);
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
      const result = await createInvoice(formData);
      if (!result.success) {
        window.alert(result.message);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fromOcr && (
        <section className="rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-800">
          <strong>他社の請求書を取り込みました。</strong>
          必要に応じて下の「割り増し」で単価を一括してから、またはそのまま金額を直接編集して自社の請求書として保存できます。
        </section>
      )}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="form">通常入力</TabsTrigger>
            <TabsTrigger value="memo">メモから作成</TabsTrigger>
          </TabsList>

          <TabsContent value="memo" className="space-y-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <p className="text-sm text-blue-800 mb-3">
                <strong>メモ形式で入力してください。</strong> 話し言葉でもOKです。Gemini（AI）が解析してフォームに入力します。取引先に同じ名前があれば、その取引先宛の請求書として紐づきます。
              </p>
              <p className="text-xs text-blue-700 mb-4">
                例: 「株式会社ABC、システム開発費10万円、2025年2月15日発行、支払期限3月末」<br />
                例: 「山田さんに、ホームページ制作50,000円と、SEO対策30,000円、合計8万円で請求して」
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">請求書</p>
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

        <section className="mx-auto w-full max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-lg">
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
                支払い期限
              </label>
              <input
                name="dueDate"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">明細</h2>
            <button
              type="button"
              onClick={handleAddRow}
              className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              行を追加
            </button>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <p className="text-xs font-medium text-slate-600 mb-2">単価に割り増し（他社請求書から転用するときに便利）</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => applyMarkup(10)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                1割上乗せ (10%)
              </button>
              <button
                type="button"
                onClick={() => applyMarkup(20)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                2割上乗せ (20%)
              </button>
              <span className="inline-flex items-center gap-1.5 text-xs">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  placeholder="例: 15"
                  value={customMarkupPercent}
                  onChange={(e) => setCustomMarkupPercent(e.target.value)}
                  className="w-16 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900"
                />
                <span className="text-slate-500">%</span>
                <button
                  type="button"
                  onClick={() => {
                    const n = parseFloat(customMarkupPercent);
                    if (!Number.isNaN(n) && n > 0) applyMarkup(n);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  適用
                </button>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              押すと全明細の単価が一括で更新されます。個別の数字はいつでも直接編集できます。
            </p>
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

          {/* 定期請求設定（金額の下・目立つ位置） */}
          <div className="mt-8 rounded-2xl border-2 border-slate-200 bg-slate-50/50 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
                <Label
                  htmlFor="recurring"
                  className="cursor-pointer text-base font-semibold text-slate-900"
                >
                  定期請求にする
                </Label>
              </div>
            </div>

            {isRecurring && (
              <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      頻度
                    </Label>
                    <Select
                      value={frequency}
                      onValueChange={(v) => setFrequency(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="頻度を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRING_FREQUENCIES.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      請求日
                    </Label>
                    <Select
                      value={billingDay}
                      onValueChange={(v) => setBillingDay(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="請求日を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {BILLING_DAYS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="nextDate"
                      className="text-xs uppercase tracking-[0.2em] text-slate-500"
                    >
                      次回作成日
                    </Label>
                    <input
                      id="nextDate"
                      name="recurringNextDate"
                      type="date"
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </section>
          </TabsContent>
        </Tabs>
      </section>
    </form>
  );
}
