import React from "react";

type DocumentItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

type DocumentData = {
  id: string;
  type: "請求書" | "見積書";
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

export const InvoiceTemplate = ({ data }: { data: DocumentData }) => {
  return (
    <div className="bg-white p-[20mm] shadow-lg print:m-0 print:p-[15mm] print:shadow-none mx-auto w-[210mm] min-h-[297mm] text-slate-800 font-sans leading-relaxed">
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

          {/* Dummy Seal */}
          <div className="absolute -right-2 top-10 opacity-60 pointer-events-none">
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

        {/* Items Table */}
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

        {/* Totals Section */}
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

        {/* Details / Bank / Remarks */}
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
              {data.remarks || (data.type === "見積書" ? "有効期限：発行から30日間" : "お振込手数料は貴社にてご負担願います。")}
            </div>
            {data.dueDate && <p className="mt-4 font-medium text-rose-600">お支払期限：{formatDate(data.dueDate)}</p>}
            {data.validUntil && <p className="mt-4 font-medium">有効期限：{formatDate(data.validUntil)}</p>}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          aside, nav, button, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-content {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};
