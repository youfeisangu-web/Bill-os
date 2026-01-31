"use client";

import React from "react";

type DocumentItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type DocumentDataType = "請求書" | "見積書" | "領収書" | "納品書";

type DocumentData = {
  id: string;
  type: DocumentDataType;
  number: string;
  issueDate: Date;
  dueDate?: Date;
  validUntil?: Date;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  subject?: string;
  remarks?: string;
  client: {
    name: string;
    address?: string | null;
  };
  user: {
    companyName: string | null;
    invoiceRegNumber: string | null;
    email: string;
  };
  bankAccount?: {
    bankName: string;
    branchName: string;
    accountType: string;
    accountNumber: string;
    accountHolder: string;
  } | null;
  items: DocumentItem[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" }).format(date);

/** 領収書レイアウト */
function ReceiptLayout({ data }: { data: DocumentData }) {
  const tori = data.items.length > 0
    ? data.items.map((i) => i.name).join("・") + " の代金として"
    : `請求書番号 ${data.number} の代金として`;
  return (
    <div className="bg-white p-[20mm] shadow-lg print:m-0 print:p-[12mm] print:shadow-none mx-auto w-[210mm] max-w-[210mm] min-h-[297mm] text-slate-800 font-sans leading-relaxed box-border print:overflow-hidden print:break-inside-avoid">
      <div className="flex justify-between items-start mb-10">
        <h1 className="text-3xl font-bold tracking-widest text-slate-900 border-b-2 border-slate-900 pb-1 pr-12 inline-block">
          領収書
        </h1>
        <div className="text-right">
          <p className="text-sm mb-1">領収書番号：{data.number}</p>
          <p className="text-sm font-medium">領収日：{formatDate(data.issueDate)}</p>
        </div>
      </div>
      <div className="mt-12 mb-8">
        <p className="text-xl font-medium border-b border-slate-400 pb-1 mb-1 min-w-[300px]">
          {data.client.name}　様
        </p>
        {data.client.address && (
          <p className="text-sm text-slate-600 ml-1">{data.client.address}</p>
        )}
      </div>
      <div className="bg-slate-50 border-y border-slate-200 p-6 flex items-end justify-between mb-8">
        <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">金額</span>
        <span className="text-3xl font-bold text-slate-900">
          ¥{formatCurrency(data.totalAmount)}-
          <span className="text-sm font-normal text-slate-500 ml-2">(税込)</span>
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-2">但し　{tori}</p>
      <p className="text-lg font-medium mt-8 mb-12">上記の通り正に領収いたしました。</p>
      <div className="flex justify-end items-end">
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">{data.user.companyName || "Bill OS"}</p>
          <p className="text-xs text-slate-500 mt-1">{data.user.email}</p>
          <div className="mt-4 w-14 h-14 border-2 border-rose-500 rounded-full flex items-center justify-center text-rose-500 font-bold rotate-12 select-none text-[10px] mx-auto">
            <div className="text-center">
              <p className="leading-none border-b border-rose-500 pb-0.5 mb-0.5">印</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 納品書レイアウト */
function DeliveryLayout({ data }: { data: DocumentData }) {
  return (
    <div className="bg-white p-[20mm] shadow-lg print:m-0 print:p-[12mm] print:shadow-none mx-auto w-[210mm] max-w-[210mm] min-h-[297mm] text-slate-800 font-sans leading-relaxed box-border print:overflow-hidden print:break-inside-avoid">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-slate-900 mb-4 border-b-2 border-slate-900 pb-1 pr-12 inline-block">
            納品書
          </h1>
          <div className="mt-8">
            <p className="text-xl font-medium border-b border-slate-400 pb-1 mb-1 min-w-[300px]">
              {data.client.name}　御中
            </p>
            {data.client.address && (
              <p className="text-sm text-slate-600 ml-1">{data.client.address}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm mb-1">納品書番号：{data.number}</p>
          <p className="text-sm mb-6">納品日：{formatDate(data.issueDate)}</p>
          <div className="mt-4">
            <p className="text-lg font-bold text-slate-900">{data.user.companyName || "Bill OS"}</p>
            <p className="text-xs text-slate-500 mt-1">{data.user.email}</p>
          </div>
        </div>
      </div>
      <p className="mb-6">下記の通り納品いたしました。</p>
      <table className="w-full text-left border-collapse mb-10">
        <thead>
          <tr className="border-b-2 border-slate-900 text-sm">
            <th className="py-2 font-bold">品名・内容</th>
            <th className="py-2 text-right font-bold w-24">数量</th>
            <th className="py-2 text-right font-bold w-28">単位</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {data.items.map((item, index) => (
            <tr key={index} className="border-b border-slate-200">
              <td className="py-3">{item.name}</td>
              <td className="py-3 text-right">{item.quantity}</td>
              <td className="py-3 text-right">式</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end mt-8">
        <div className="w-14 h-14 border-2 border-rose-500 rounded-full flex items-center justify-center text-rose-500 font-bold rotate-12 select-none text-[10px]">
          <div className="text-center">
            <p className="leading-none border-b border-rose-500 pb-0.5 mb-0.5">印</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const InvoiceTemplate = ({ data }: { data: DocumentData }) => {
  if (data.type === "領収書") {
    return <ReceiptLayout data={data} />;
  }
  if (data.type === "納品書") {
    return <DeliveryLayout data={data} />;
  }

  return (
    <div className="bg-white p-[20mm] shadow-lg print:m-0 print:p-[12mm] print:shadow-none mx-auto w-[210mm] max-w-[210mm] min-h-[297mm] text-slate-800 font-sans leading-relaxed box-border print:overflow-hidden print:break-inside-avoid">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-slate-900 mb-4 border-b-2 border-slate-900 pb-1 pr-12 inline-block">
            {data.type}
          </h1>
          <div className="mt-8">
            <p className="text-xl font-medium border-b border-slate-400 pb-1 mb-1 min-w-[300px]">
              {data.client.name}　御中
            </p>
            {data.client.address && (
              <p className="text-sm text-slate-600 ml-1">{data.client.address}</p>
            )}
          </div>
        </div>

        <div className="text-right relative">
          <p className="text-sm mb-1">{data.type}番号：{data.number}</p>
          <p className="text-sm mb-6">発行日：{formatDate(data.issueDate)}</p>
          
          <div className="mt-4">
            <p className="text-lg font-bold text-slate-900">{data.user.companyName || "Bill OS"}</p>
            {data.user.invoiceRegNumber && (
              <p className="text-xs text-slate-500 mt-1">登録番号：{data.user.invoiceRegNumber}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">{data.user.email}</p>
          </div>

          <div className="absolute right-0 top-10 opacity-60 pointer-events-none">
            <div className="w-14 h-14 border-2 border-rose-500 rounded-full flex items-center justify-center text-rose-500 font-bold rotate-12 select-none text-[10px]">
              <div className="text-center">
                <p className="leading-none border-b border-rose-500 pb-0.5 mb-0.5">Bill OS</p>
                <p className="leading-none">印</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mb-10">
        {data.subject && (
          <p className="text-lg font-medium mb-8 border-b border-slate-200 pb-2">
            件名：{data.subject}
          </p>
        )}
        
        <p className="mb-4">下記の通りご{data.type === "見積書" ? "見積" : "請求"}申し上げます。</p>
        
        <div className="bg-slate-50 border-y border-slate-200 p-6 flex items-end justify-between mb-10">
          <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">御合計金額</span>
          <span className="text-3xl font-bold text-slate-900">
            ¥{formatCurrency(data.totalAmount)}-
            <span className="text-sm font-normal text-slate-500 ml-2 tracking-normal">(税込)</span>
          </span>
        </div>

        <table className="w-full text-left border-collapse mb-10">
          <thead>
            <tr className="border-b-2 border-slate-900 text-sm">
              <th className="py-2 font-bold">内容</th>
              <th className="py-2 text-right font-bold w-20">数量</th>
              <th className="py-2 text-right font-bold w-32">単価</th>
              <th className="py-2 text-right font-bold w-32">金額</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-200">
                <td className="py-3">{item.name}</td>
                <td className="py-3 text-right">{item.quantity}</td>
                <td className="py-3 text-right">¥{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 text-right font-medium">¥{formatCurrency(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-12">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between pb-1 border-b border-slate-100">
              <span className="text-slate-500">小計</span>
              <span>¥{formatCurrency(data.subtotal)}</span>
            </div>
            <div className="flex justify-between pb-1 border-b border-slate-100 text-slate-500">
              <span className="text-xs">消費税 (10%)</span>
              <span>¥{formatCurrency(data.taxAmount)}</span>
            </div>
            <div className="flex justify-between pt-1 font-bold text-lg">
              <span>合計</span>
              <span>¥{formatCurrency(data.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm">
          {data.bankAccount && (
            <div className="space-y-1">
              <p className="font-bold border-b border-slate-300 pb-1 mb-2">【お振込先】</p>
              <p>{data.bankAccount.bankName} {data.bankAccount.branchName}</p>
              <p>{data.bankAccount.accountType} {data.bankAccount.accountNumber}</p>
              <p>口座名義：{data.bankAccount.accountHolder}</p>
            </div>
          )}
          
          <div className="space-y-1">
            <p className="font-bold border-b border-slate-300 pb-1 mb-2">【備考】</p>
            <div className="whitespace-pre-wrap text-slate-600 text-xs">
              {data.remarks || (data.type === "見積書" ? "上記金額は支払い期限までにお振込ください。" : "お振込手数料は貴社にてご負担願います。")}
            </div>
            {data.dueDate && <p className="mt-4 font-medium text-rose-600">お支払期限：{formatDate(data.dueDate)}</p>}
            {data.validUntil && <p className="mt-4 font-medium text-rose-600">お支払期限：{formatDate(data.validUntil)}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
