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

// デザインパターン: クラシック（既存のデザイン）
function ClassicLayout({ data }: { data: DocumentData }) {
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
}

// デザインパターン: モダン
function ModernLayout({ data }: { data: DocumentData }) {
  return (
    <div className="bg-white p-[20mm] shadow-lg print:m-0 print:p-[12mm] print:shadow-none mx-auto w-[210mm] max-w-[210mm] min-h-[297mm] text-slate-800 font-sans leading-relaxed box-border print:overflow-hidden print:break-inside-avoid">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 -m-[20mm] mb-8 print:m-0 print:mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{data.type}</h1>
            <p className="text-blue-100 text-sm">{data.type}番号：{data.number}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">発行日：{formatDate(data.issueDate)}</p>
            {data.dueDate && <p className="text-sm text-blue-100 mt-1">支払期限：{formatDate(data.dueDate)}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start mb-10">
        <div>
          <p className="text-xl font-semibold mb-2">{data.client.name}　御中</p>
          {data.client.address && <p className="text-sm text-slate-600">{data.client.address}</p>}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">{data.user.companyName || "Bill OS"}</p>
          {data.user.invoiceRegNumber && <p className="text-xs text-slate-500 mt-1">登録番号：{data.user.invoiceRegNumber}</p>}
          <p className="text-xs text-slate-500 mt-1">{data.user.email}</p>
        </div>
      </div>

      {data.subject && (
        <p className="text-lg font-medium mb-6 pb-2 border-b-2 border-blue-200">
          {data.subject}
        </p>
      )}

      <p className="mb-6 text-slate-700">下記の通りご{data.type === "見積書" ? "見積" : "請求"}申し上げます。</p>

      <table className="w-full text-left border-collapse mb-8">
        <thead>
          <tr className="bg-blue-50 text-sm">
            <th className="py-3 px-4 font-bold text-slate-900">内容</th>
            <th className="py-3 px-4 text-right font-bold text-slate-900 w-20">数量</th>
            <th className="py-3 px-4 text-right font-bold text-slate-900 w-32">単価</th>
            <th className="py-3 px-4 text-right font-bold text-slate-900 w-32">金額</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {data.items.map((item, index) => (
            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-3 px-4">{item.name}</td>
              <td className="py-3 px-4 text-right">{item.quantity}</td>
              <td className="py-3 px-4 text-right">¥{formatCurrency(item.unitPrice)}</td>
              <td className="py-3 px-4 text-right font-medium">¥{formatCurrency(item.quantity * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-10">
        <div className="w-80 space-y-3 text-sm bg-slate-50 p-6 rounded-lg">
          <div className="flex justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-600">小計</span>
            <span className="font-medium">¥{formatCurrency(data.subtotal)}</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-slate-200 text-slate-600">
            <span className="text-xs">消費税 (10%)</span>
            <span>¥{formatCurrency(data.taxAmount)}</span>
          </div>
          <div className="flex justify-between pt-2 font-bold text-xl text-blue-600">
            <span>合計</span>
            <span>¥{formatCurrency(data.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 text-sm border-t-2 border-slate-200 pt-6">
        {data.bankAccount && (
          <div className="space-y-2">
            <p className="font-bold text-slate-900 mb-2">【お振込先】</p>
            <p className="text-slate-700">{data.bankAccount.bankName} {data.bankAccount.branchName}</p>
            <p className="text-slate-700">{data.bankAccount.accountType} {data.bankAccount.accountNumber}</p>
            <p className="text-slate-700">口座名義：{data.bankAccount.accountHolder}</p>
          </div>
        )}
        <div className="space-y-2">
          <p className="font-bold text-slate-900 mb-2">【備考】</p>
          <div className="whitespace-pre-wrap text-slate-600 text-xs">
            {data.remarks || (data.type === "見積書" ? "上記金額は支払い期限までにお振込ください。" : "お振込手数料は貴社にてご負担願います。")}
          </div>
        </div>
      </div>
    </div>
  );
}

// デザインパターン: ミニマル
function MinimalLayout({ data }: { data: DocumentData }) {
  return (
    <div className="bg-white p-[20mm] shadow-lg print:m-0 print:p-[12mm] print:shadow-none mx-auto w-[210mm] max-w-[210mm] min-h-[297mm] text-slate-800 font-sans leading-relaxed box-border print:overflow-hidden print:break-inside-avoid">
      <div className="mb-12">
        <div className="flex justify-between items-baseline mb-8 pb-4 border-b-2 border-slate-900">
          <h1 className="text-4xl font-light tracking-wide text-slate-900">{data.type}</h1>
          <div className="text-right text-sm text-slate-500">
            <p>{data.type}番号：{data.number}</p>
            <p className="mt-1">発行日：{formatDate(data.issueDate)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">請求先</p>
            <p className="text-lg font-medium text-slate-900">{data.client.name}</p>
            {data.client.address && <p className="text-sm text-slate-600 mt-1">{data.client.address}</p>}
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">発行者</p>
            <p className="text-lg font-medium text-slate-900">{data.user.companyName || "Bill OS"}</p>
            {data.user.invoiceRegNumber && <p className="text-xs text-slate-500 mt-1">登録番号：{data.user.invoiceRegNumber}</p>}
            <p className="text-xs text-slate-500 mt-1">{data.user.email}</p>
          </div>
        </div>
      </div>

      <table className="w-full text-left border-collapse mb-8">
        <thead>
          <tr className="border-b border-slate-300 text-sm">
            <th className="py-3 font-medium text-slate-700">内容</th>
            <th className="py-3 text-right font-medium text-slate-700 w-20">数量</th>
            <th className="py-3 text-right font-medium text-slate-700 w-32">単価</th>
            <th className="py-3 text-right font-medium text-slate-700 w-32">金額</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {data.items.map((item, index) => (
            <tr key={index} className="border-b border-slate-100">
              <td className="py-4 text-slate-900">{item.name}</td>
              <td className="py-4 text-right text-slate-600">{item.quantity}</td>
              <td className="py-4 text-right text-slate-600">¥{formatCurrency(item.unitPrice)}</td>
              <td className="py-4 text-right text-slate-900">¥{formatCurrency(item.quantity * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-12">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>小計</span>
            <span>¥{formatCurrency(data.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-500 text-xs">
            <span>消費税 (10%)</span>
            <span>¥{formatCurrency(data.taxAmount)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t-2 border-slate-900 font-bold text-lg text-slate-900">
            <span>合計</span>
            <span>¥{formatCurrency(data.totalAmount)}</span>
          </div>
        </div>
      </div>

      {data.bankAccount && (
        <div className="text-sm text-slate-600 border-t border-slate-200 pt-6">
          <p className="font-medium text-slate-900 mb-2">お振込先</p>
          <p>{data.bankAccount.bankName} {data.bankAccount.branchName} {data.bankAccount.accountType} {data.bankAccount.accountNumber}</p>
          <p className="mt-1">口座名義：{data.bankAccount.accountHolder}</p>
        </div>
      )}
    </div>
  );
}

// デザインパターン: エレガント
function ElegantLayout({ data }: { data: DocumentData }) {
  return (
    <div className="bg-white p-[20mm] shadow-lg print:m-0 print:p-[12mm] print:shadow-none mx-auto w-[210mm] max-w-[210mm] min-h-[297mm] text-slate-800 font-serif leading-relaxed box-border print:overflow-hidden print:break-inside-avoid">
      <div className="text-center mb-12 pb-6 border-b-2 border-slate-300">
        <h1 className="text-4xl font-serif italic text-slate-800 mb-2">{data.type}</h1>
        <p className="text-sm text-slate-500">{data.type}番号：{data.number}　発行日：{formatDate(data.issueDate)}</p>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">請求先</p>
          <p className="text-xl font-serif text-slate-900 mb-1">{data.client.name}　様</p>
          {data.client.address && <p className="text-sm text-slate-600 font-sans">{data.client.address}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">発行者</p>
          <p className="text-xl font-serif text-slate-900 mb-1">{data.user.companyName || "Bill OS"}</p>
          {data.user.invoiceRegNumber && <p className="text-xs text-slate-500 font-sans mt-1">登録番号：{data.user.invoiceRegNumber}</p>}
          <p className="text-xs text-slate-500 font-sans mt-1">{data.user.email}</p>
        </div>
      </div>

      {data.subject && (
        <p className="text-center text-lg font-serif italic text-slate-700 mb-8 pb-4 border-b border-slate-200">
          {data.subject}
        </p>
      )}

      <p className="text-center text-slate-700 mb-8 font-serif">下記の通りご{data.type === "見積書" ? "見積" : "請求"}申し上げます。</p>

      <table className="w-full text-left border-collapse mb-10">
        <thead>
          <tr className="border-y-2 border-slate-400 text-sm font-serif">
            <th className="py-3 font-normal text-slate-700">内容</th>
            <th className="py-3 text-right font-normal text-slate-700 w-20">数量</th>
            <th className="py-3 text-right font-normal text-slate-700 w-32">単価</th>
            <th className="py-3 text-right font-normal text-slate-700 w-32">金額</th>
          </tr>
        </thead>
        <tbody className="text-sm font-serif">
          {data.items.map((item, index) => (
            <tr key={index} className="border-b border-slate-200">
              <td className="py-4 text-slate-800">{item.name}</td>
              <td className="py-4 text-right text-slate-600">{item.quantity}</td>
              <td className="py-4 text-right text-slate-600">¥{formatCurrency(item.unitPrice)}</td>
              <td className="py-4 text-right text-slate-800">¥{formatCurrency(item.quantity * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-12">
        <div className="w-72 space-y-3 text-sm font-serif bg-slate-50 p-6 border border-slate-200">
          <div className="flex justify-between pb-2 border-b border-slate-300">
            <span className="text-slate-600">小計</span>
            <span className="text-slate-800">¥{formatCurrency(data.subtotal)}</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-slate-300 text-slate-500 text-xs">
            <span>消費税 (10%)</span>
            <span>¥{formatCurrency(data.taxAmount)}</span>
          </div>
          <div className="flex justify-between pt-2 font-bold text-xl text-slate-900">
            <span>合計</span>
            <span>¥{formatCurrency(data.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 text-sm font-serif border-t border-slate-300 pt-6">
        {data.bankAccount && (
          <div className="space-y-2">
            <p className="font-bold text-slate-900 mb-2">【お振込先】</p>
            <p className="text-slate-700">{data.bankAccount.bankName} {data.bankAccount.branchName}</p>
            <p className="text-slate-700">{data.bankAccount.accountType} {data.bankAccount.accountNumber}</p>
            <p className="text-slate-700">口座名義：{data.bankAccount.accountHolder}</p>
          </div>
        )}
        <div className="space-y-2">
          <p className="font-bold text-slate-900 mb-2">【備考】</p>
          <div className="whitespace-pre-wrap text-slate-600 text-xs font-sans">
            {data.remarks || (data.type === "見積書" ? "上記金額は支払い期限までにお振込ください。" : "お振込手数料は貴社にてご負担願います。")}
          </div>
          {data.dueDate && <p className="mt-4 font-medium text-slate-800">お支払期限：{formatDate(data.dueDate)}</p>}
        </div>
      </div>
    </div>
  );
}

// デザインパターン: プロフェッショナル
function ProfessionalLayout({ data }: { data: DocumentData }) {
  return (
    <div className="bg-white p-[20mm] shadow-lg print:m-0 print:p-[12mm] print:shadow-none mx-auto w-[210mm] max-w-[210mm] min-h-[297mm] text-slate-800 font-sans leading-relaxed box-border print:overflow-hidden print:break-inside-avoid">
      {/* Header bar */}
      <div className="bg-slate-900 text-white p-4 -m-[20mm] mb-8 print:m-0 print:mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{data.type}</h1>
          <div className="text-right text-sm">
            <p className="text-slate-300">No. {data.number}</p>
            <p className="text-slate-300 mt-1">{formatDate(data.issueDate)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-10">
        <div className="border-l-4 border-slate-900 pl-4">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Bill To</p>
          <p className="text-lg font-bold text-slate-900 mb-1">{data.client.name}</p>
          {data.client.address && <p className="text-sm text-slate-600">{data.client.address}</p>}
        </div>
        <div className="border-l-4 border-slate-900 pl-4">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">From</p>
          <p className="text-lg font-bold text-slate-900 mb-1">{data.user.companyName || "Bill OS"}</p>
          {data.user.invoiceRegNumber && <p className="text-xs text-slate-600 mt-1">登録番号：{data.user.invoiceRegNumber}</p>}
          <p className="text-xs text-slate-600 mt-1">{data.user.email}</p>
        </div>
      </div>

      {data.subject && (
        <div className="bg-slate-50 p-4 mb-6 border-l-4 border-slate-900">
          <p className="text-sm uppercase tracking-widest text-slate-500 mb-1">Subject</p>
          <p className="text-lg font-semibold text-slate-900">{data.subject}</p>
        </div>
      )}

      <table className="w-full text-left border-collapse mb-8">
        <thead>
          <tr className="bg-slate-900 text-white text-xs uppercase tracking-widest">
            <th className="py-3 px-4 font-bold">Description</th>
            <th className="py-3 px-4 text-right font-bold w-20">Qty</th>
            <th className="py-3 px-4 text-right font-bold w-32">Unit Price</th>
            <th className="py-3 px-4 text-right font-bold w-32">Amount</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {data.items.map((item, index) => (
            <tr key={index} className="border-b border-slate-200">
              <td className="py-3 px-4 text-slate-900">{item.name}</td>
              <td className="py-3 px-4 text-right text-slate-600">{item.quantity}</td>
              <td className="py-3 px-4 text-right text-slate-600">¥{formatCurrency(item.unitPrice)}</td>
              <td className="py-3 px-4 text-right font-semibold text-slate-900">¥{formatCurrency(item.quantity * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-10">
        <div className="w-80">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>¥{formatCurrency(data.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-xs">
              <span>Tax (10%)</span>
              <span>¥{formatCurrency(data.taxAmount)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t-2 border-slate-900 font-bold text-xl text-slate-900">
              <span>TOTAL</span>
              <span>¥{formatCurrency(data.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 text-sm border-t-2 border-slate-200 pt-6">
        {data.bankAccount && (
          <div className="space-y-2">
            <p className="font-bold text-slate-900 uppercase text-xs tracking-widest mb-2">Payment Details</p>
            <p className="text-slate-700">{data.bankAccount.bankName} {data.bankAccount.branchName}</p>
            <p className="text-slate-700">{data.bankAccount.accountType} {data.bankAccount.accountNumber}</p>
            <p className="text-slate-700">Account Holder: {data.bankAccount.accountHolder}</p>
          </div>
        )}
        <div className="space-y-2">
          <p className="font-bold text-slate-900 uppercase text-xs tracking-widest mb-2">Notes</p>
          <div className="whitespace-pre-wrap text-slate-600 text-xs">
            {data.remarks || (data.type === "見積書" ? "Please remit the above amount by the due date." : "Bank transfer fees are to be paid by the client.")}
          </div>
          {data.dueDate && <p className="mt-4 font-semibold text-slate-900">Due Date: {formatDate(data.dueDate)}</p>}
        </div>
      </div>
    </div>
  );
}

export const InvoiceTemplate = ({ data, design = "classic" }: { data: DocumentData; design?: string }) => {
  if (data.type === "領収書") {
    return <ReceiptLayout data={data} />;
  }
  if (data.type === "納品書") {
    return <DeliveryLayout data={data} />;
  }

  switch (design) {
    case "modern":
      return <ModernLayout data={data} />;
    case "minimal":
      return <MinimalLayout data={data} />;
    case "elegant":
      return <ElegantLayout data={data} />;
    case "professional":
      return <ProfessionalLayout data={data} />;
    case "classic":
    default:
      return <ClassicLayout data={data} />;
  }
};
