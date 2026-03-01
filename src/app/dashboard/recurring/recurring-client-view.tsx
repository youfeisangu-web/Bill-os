"use client";

import { useState, useEffect } from "react";
import {
  createRecurringTemplate,
  updateRecurringTemplate,
  deleteRecurringTemplate,
  toggleRecurringTemplate,
  getRecurringTemplates,
} from "@/app/actions/recurring";
import { Plus, Pencil, Trash2, Power, Calendar, AlertCircle, X } from "lucide-react";
import { getTenantsByGroup } from "@/app/actions/tenant";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RecurringTemplate = {
  id: string;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    nameKana: string;
    amount: number;
  };
  clientId: string | null;
  client: {
    id: string;
    name: string;
  } | null;
  interval: string;
  creationDay: number;
  sendDay: number | null;
  isActive: boolean;
  startDate: Date;
  endDate: Date | null;
  nextExecutionDate: Date;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }>;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type GeneratedInvoice = {
  id: string;
  issueDate: string;
  totalAmount: number;
  clientName: string;
  clientEmail: string;
};

type RecurringClientViewProps = {
  templates: RecurringTemplate[];
  generatedInvoices: GeneratedInvoice[];
};

function buildMailto(to: string, subject: string, body: string): string {
  const u = new URL("mailto:" + encodeURIComponent(to));
  u.searchParams.set("subject", subject);
  u.searchParams.set("body", body);
  return u.toString();
}

export default function RecurringClientView({
  templates: initialTemplates,
  generatedInvoices = [],
}: RecurringClientViewProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  // フォーム状態
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [interval, setInterval] = useState("MONTHLY");
  const [creationDay, setCreationDay] = useState(25);
  const [sendDay, setSendDay] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [items, setItems] = useState([
    { name: "", quantity: 1, unitPrice: 0, taxRate: 10 },
  ]);
  const [note, setNote] = useState("");

  const [tenants, setTenants] = useState<Array<{ id: string; name: string; amount: number }>>([]);

  // 取引先一覧を読み込む
  useEffect(() => {
    getTenantsByGroup(null).then((data) => {
      setTenants(data.map((t) => ({ id: t.id, name: t.name, amount: t.amount })));
    });
  }, []);

  // Tenant選択時に自動で金額と項目をセット
  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    
    if (tenantId && !editingTemplate) {
      const selectedTenant = tenants.find((t) => t.id === tenantId);
      if (selectedTenant && selectedTenant.amount > 0) {
        // 金額を自動セット
        setItems([
          {
            name: "月額請求",
            quantity: 1,
            unitPrice: selectedTenant.amount,
            taxRate: 10,
          },
        ]);
      }
    }
  };

  const handleOpenDialog = (template?: RecurringTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setSelectedTenantId(template.tenantId);
      setInterval(template.interval);
      setCreationDay(template.creationDay);
      setSendDay(template.sendDay);
      setStartDate(template.startDate.toISOString().split("T")[0]);
      setEndDate(template.endDate ? template.endDate.toISOString().split("T")[0] : "");
      setItems(template.items);
      setNote(template.note || "");
    } else {
      setEditingTemplate(null);
      setSelectedTenantId("");
      setInterval("MONTHLY");
      setCreationDay(25);
      setSendDay(null);
      setStartDate("");
      setEndDate("");
      setItems([{ name: "", quantity: 1, unitPrice: 0, taxRate: 10 }]);
      setNote("");
    }
    setShowDialog(true);
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setShowDialog(false);
      setEditingTemplate(null);
      // フォームをリセット
      setSelectedTenantId("");
      setInterval("MONTHLY");
      setCreationDay(25);
      setSendDay(null);
      setStartDate("");
      setEndDate("");
      setItems([{ name: "", quantity: 1, unitPrice: 0, taxRate: 10 }]);
      setNote("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("tenantId", selectedTenantId);
      formData.append("interval", interval);
      formData.append("creationDay", creationDay.toString());
      if (sendDay) {
        formData.append("sendDay", sendDay.toString());
      }
      formData.append("startDate", startDate);
      if (endDate) {
        formData.append("endDate", endDate);
      }
      formData.append("items", JSON.stringify(items));
      if (note) {
        formData.append("note", note);
      }

      let result;
      if (editingTemplate) {
        formData.append("isActive", editingTemplate.isActive.toString());
        result = await updateRecurringTemplate(editingTemplate.id, formData);
      } else {
        result = await createRecurringTemplate(formData);
      }

      if (result.success) {
        handleCloseDialog(false);
        // テンプレート一覧を再取得
        const updatedTemplates = await getRecurringTemplates();
        setTemplates(updatedTemplates);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("この定期請求テンプレートを削除しますか？")) {
      return;
    }

    const result = await deleteRecurringTemplate(templateId);
    if (result.success) {
      // テンプレート一覧を再取得
      const updatedTemplates = await getRecurringTemplates();
      setTemplates(updatedTemplates);
    } else {
      alert(result.message);
    }
  };

  const handleToggle = async (templateId: string, currentStatus: boolean) => {
    const result = await toggleRecurringTemplate(templateId, !currentStatus);
    if (result.success) {
      // テンプレート一覧を再取得
      const updatedTemplates = await getRecurringTemplates();
      setTemplates(updatedTemplates);
    } else {
      alert(result.message);
    }
  };

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, unitPrice: 0, taxRate: 10 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="py-5 space-y-4 pb-12 md:py-8 md:space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-billia-text md:text-2xl">定期請求</h1>
          <p className="text-xs text-billia-text-muted mt-0.5 md:text-sm">
            毎月自動で請求書を作成する設定を管理します
          </p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2 bg-gradient-to-r from-billia-blue to-billia-green text-white px-3 py-2 text-sm rounded-xl font-semibold shrink-0 md:px-4"
        >
          <Plus className="w-4 h-4" />
          新規作成
        </button>
      </div>

      {/* 今月・定期請求で作成した請求書（送付用） */}
      {generatedInvoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-billia-text md:text-base">
              今月作成した請求書（送付）
            </h2>
            <p className="text-xs text-billia-text-muted mt-0.5 md:text-sm">
              定期請求で自動作成された請求書です。メールで送付する場合はボタンから起動してください。
            </p>
          </div>

          {/* モバイル: カード表示 */}
          <div className="divide-y divide-gray-100 md:hidden">
            {generatedInvoices.map((inv) => {
              const subject = `請求書 ${inv.id}`;
              const body = ["お世話になっております。", "", "下記の請求書をご確認ください。", "", `請求書番号: ${inv.id}`, `発行日: ${inv.issueDate}`, `合計金額: ¥${inv.totalAmount.toLocaleString()}`, "", "よろしくお願いいたします。"].join("\n");
              const mailto = inv.clientEmail ? buildMailto(inv.clientEmail, subject, body) : null;
              return (
                <div key={inv.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <a href={`/dashboard/invoices/${inv.id}`} className="text-sm font-medium text-billia-blue truncate block">{inv.id}</a>
                      <p className="text-sm text-billia-text">{inv.clientName}</p>
                    </div>
                    <p className="text-sm font-semibold text-billia-text shrink-0">¥{inv.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-billia-text-muted">{inv.issueDate}</p>
                    {mailto ? (
                      <a href={mailto} className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">📧 メール送付</a>
                    ) : (
                      <span className="text-xs text-billia-text-muted">メール未設定</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* デスクトップ: テーブル表示 */}
          <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-billia-text">
                  請求書番号
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-billia-text">
                  取引先
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-billia-text">
                  発行日
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-billia-text">
                  金額
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-billia-text">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {generatedInvoices.map((inv) => {
                const subject = `請求書 ${inv.id}`;
                const body = [
                  "お世話になっております。",
                  "",
                  "下記の請求書をご確認ください。",
                  "",
                  `請求書番号: ${inv.id}`,
                  `発行日: ${inv.issueDate}`,
                  `合計金額: ¥${inv.totalAmount.toLocaleString()}`,
                  "",
                  "よろしくお願いいたします。",
                ].join("\n");
                const mailto = inv.clientEmail
                  ? buildMailto(inv.clientEmail, subject, body)
                  : null;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <a
                        href={`/dashboard/invoices/${inv.id}`}
                        className="text-billia-blue hover:underline font-medium"
                      >
                        {inv.id}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-billia-text">
                      {inv.clientName}
                    </td>
                    <td className="px-4 py-3 text-sm text-billia-text">
                      {inv.issueDate}
                    </td>
                    <td className="px-4 py-3 text-sm text-billia-text text-right">
                      ¥{inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {mailto ? (
                        <a
                          href={mailto}
                          className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-100"
                        >
                          📧 メールで送付
                        </a>
                      ) : (
                        <span className="text-xs text-billia-text-muted">
                          メール未設定
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* テンプレート一覧 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {templates.length === 0 ? (
          <div className="p-10 text-center text-billia-text-muted">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">定期請求テンプレートがありません</p>
            <p className="text-xs mt-1">新規作成ボタンから追加してください</p>
          </div>
        ) : (
          <>
            {/* モバイル: カード表示 */}
            <div className="divide-y divide-gray-100 md:hidden">
              {templates.map((template) => (
                <div key={template.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-billia-text truncate">{template.tenant.name}</p>
                      <p className="text-xs text-billia-text-muted">毎月{template.creationDay}日 · 次回: {formatDate(template.nextExecutionDate)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${template.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {template.isActive ? "有効" : "無効"}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleToggle(template.id, template.isActive)} className="p-2 text-gray-500 hover:text-billia-blue" title={template.isActive ? "無効化" : "有効化"}>
                      <Power className={`w-4 h-4 ${!template.isActive ? "opacity-40" : ""}`} />
                    </button>
                    <button onClick={() => handleOpenDialog(template)} className="p-2 text-gray-500 hover:text-billia-blue">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(template.id)} className="p-2 text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* デスクトップ: テーブル表示 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-billia-text">取引先</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-billia-text">作成日</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-billia-text">次回実行日</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-billia-text">状態</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-billia-text">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {templates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-billia-text">{template.tenant.name}</div>
                        <div className="text-sm text-billia-text-muted">{template.tenant.nameKana}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-billia-text">毎月{template.creationDay}日</td>
                      <td className="px-4 py-3 text-sm text-billia-text">{formatDate(template.nextExecutionDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${template.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {template.isActive ? "有効" : "無効"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleToggle(template.id, template.isActive)} className="p-2 text-gray-600 hover:text-billia-blue" title={template.isActive ? "無効化" : "有効化"}>
                            <Power className={`w-4 h-4 ${!template.isActive ? "opacity-50" : ""}`} />
                          </button>
                          <button onClick={() => handleOpenDialog(template)} className="p-2 text-gray-600 hover:text-billia-blue">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(template.id)} className="p-2 text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 作成/編集ダイアログ */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "定期請求を編集" : "定期請求を作成"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "定期請求テンプレートの設定を変更します"
                : "毎月自動で請求書を作成するテンプレートを設定します"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
              {/* 取引先選択 */}
              <div>
                <label className="block text-sm font-medium text-billia-text mb-2">
                  取引先 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => handleTenantChange(e.target.value)}
                  required
                  disabled={!!editingTemplate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billia-blue"
                >
                  <option value="">選択してください</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.amount.toLocaleString()}円)
                    </option>
                  ))}
                </select>
              </div>

              {/* 間隔 */}
              <div>
                <label className="block text-sm font-medium text-billia-text mb-2">
                  間隔 <span className="text-red-500">*</span>
                </label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billia-blue"
                >
                  <option value="MONTHLY">毎月</option>
                  <option value="WEEKLY">毎週</option>
                  <option value="YEARLY">毎年</option>
                </select>
              </div>

              {/* 作成日 */}
              <div>
                <label className="block text-sm font-medium text-billia-text mb-2">
                  作成日（毎月何日） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={creationDay}
                  onChange={(e) => setCreationDay(parseInt(e.target.value) || 1)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billia-blue"
                />
                <p className="text-xs text-billia-text-muted mt-1">
                  1-31の範囲で指定してください
                </p>
              </div>

              {/* 送信日（オプション） */}
              <div>
                <label className="block text-sm font-medium text-billia-text mb-2">
                  送信日（毎月何日、オプション）
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={sendDay || ""}
                  onChange={(e) =>
                    setSendDay(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billia-blue"
                />
                <p className="text-xs text-billia-text-muted mt-1">
                  将来のメール送信用（現在は未使用）
                </p>
              </div>

              {/* 開始日 */}
              <div>
                <label className="block text-sm font-medium text-billia-text mb-2">
                  開始日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billia-blue"
                />
              </div>

              {/* 終了日 */}
              <div>
                <label className="block text-sm font-medium text-billia-text mb-2">
                  終了日（オプション）
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billia-blue"
                />
                <p className="text-xs text-billia-text-muted mt-1">
                  未指定の場合は無期限で実行されます
                </p>
              </div>

              {/* 明細 */}
              <div>
                <label className="block text-sm font-medium text-billia-text mb-2">
                  請求明細 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 p-3 space-y-2 md:border-0 md:p-0 md:space-y-0 md:flex md:gap-2 md:items-end">
                      {/* 項目名 + 削除ボタン (モバイル) */}
                      <div className="flex gap-2 items-center md:flex-1">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="項目名"
                            value={item.name}
                            onChange={(e) => updateItem(index, "name", e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billia-blue text-sm"
                          />
                        </div>
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeItem(index)} className="md:hidden p-1.5 text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {/* 数量・単価・税率 */}
                      <div className="grid grid-cols-3 gap-2 md:contents">
                        <div className="md:w-24">
                          <label className="text-[10px] text-gray-400 mb-0.5 block md:hidden">数量</label>
                          <input
                            type="number"
                            placeholder="数量"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billia-blue text-sm"
                          />
                        </div>
                        <div className="md:w-32">
                          <label className="text-[10px] text-gray-400 mb-0.5 block md:hidden">単価</label>
                          <input
                            type="number"
                            placeholder="単価"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, "unitPrice", parseInt(e.target.value) || 0)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billia-blue text-sm"
                          />
                        </div>
                        <div className="md:w-24">
                          <label className="text-[10px] text-gray-400 mb-0.5 block md:hidden">税率%</label>
                          <input
                            type="number"
                            placeholder="税率"
                            min="0"
                            max="100"
                            value={item.taxRate || 10}
                            onChange={(e) => updateItem(index, "taxRate", parseInt(e.target.value) || 10)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billia-blue text-sm"
                          />
                        </div>
                      </div>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(index)} className="hidden md:block p-2 text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-2 text-sm text-billia-blue hover:text-billia-blue-dark"
                >
                  + 明細を追加
                </button>
              </div>

              {/* 備考 */}
              <div>
                <label className="block text-sm font-medium text-billia-text mb-2">
                  備考
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billia-blue"
                />
              </div>

            {/* ボタン */}
            <DialogFooter>
              <button
                type="button"
                onClick={() => handleCloseDialog(false)}
                className="px-4 py-2 text-billia-text-muted hover:text-billia-text transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-billia-blue to-billia-green text-white rounded-lg font-semibold hover:from-billia-blue-dark hover:to-billia-green-dark transition-all shadow-sm disabled:opacity-50"
              >
                {loading ? "保存中..." : editingTemplate ? "更新" : "作成"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
