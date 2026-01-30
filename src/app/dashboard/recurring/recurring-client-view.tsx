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

type RecurringClientViewProps = {
  templates: RecurringTemplate[];
};

export default function RecurringClientView({
  templates: initialTemplates,
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

  // 入居者一覧を読み込む
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-billio-text">定期請求</h1>
          <p className="text-sm text-billio-text-muted mt-1">
            毎月自動で請求書を作成する設定を管理します
          </p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2 bg-gradient-to-r from-billio-blue to-billio-green text-white px-4 py-2 rounded-lg font-semibold hover:from-billio-blue-dark hover:to-billio-green-dark transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          新規作成
        </button>
      </div>

      {/* テンプレート一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {templates.length === 0 ? (
          <div className="p-12 text-center text-billio-text-muted">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>定期請求テンプレートがありません</p>
            <p className="text-sm mt-2">新規作成ボタンから追加してください</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-billio-text">
                  入居者
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-billio-text">
                  作成日
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-billio-text">
                  次回実行日
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-billio-text">
                  状態
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-billio-text">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-billio-text">
                      {template.tenant.name}
                    </div>
                    <div className="text-sm text-billio-text-muted">
                      {template.tenant.nameKana}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-billio-text">
                    毎月{template.creationDay}日
                  </td>
                  <td className="px-4 py-3 text-sm text-billio-text">
                    {formatDate(template.nextExecutionDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        template.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {template.isActive ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggle(template.id, template.isActive)}
                        className="p-2 text-gray-600 hover:text-billio-blue transition-colors"
                        title={template.isActive ? "無効化" : "有効化"}
                      >
                        <Power
                          className={`w-4 h-4 ${!template.isActive ? "opacity-50" : ""}`}
                        />
                      </button>
                      <button
                        onClick={() => handleOpenDialog(template)}
                        className="p-2 text-gray-600 hover:text-billio-blue transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              {/* 入居者選択 */}
              <div>
                <label className="block text-sm font-medium text-billio-text mb-2">
                  入居者 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => handleTenantChange(e.target.value)}
                  required
                  disabled={!!editingTemplate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billio-blue"
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
                <label className="block text-sm font-medium text-billio-text mb-2">
                  間隔 <span className="text-red-500">*</span>
                </label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billio-blue"
                >
                  <option value="MONTHLY">毎月</option>
                  <option value="WEEKLY">毎週</option>
                  <option value="YEARLY">毎年</option>
                </select>
              </div>

              {/* 作成日 */}
              <div>
                <label className="block text-sm font-medium text-billio-text mb-2">
                  作成日（毎月何日） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={creationDay}
                  onChange={(e) => setCreationDay(parseInt(e.target.value) || 1)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billio-blue"
                />
                <p className="text-xs text-billio-text-muted mt-1">
                  1-31の範囲で指定してください
                </p>
              </div>

              {/* 送信日（オプション） */}
              <div>
                <label className="block text-sm font-medium text-billio-text mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billio-blue"
                />
                <p className="text-xs text-billio-text-muted mt-1">
                  将来のメール送信用（現在は未使用）
                </p>
              </div>

              {/* 開始日 */}
              <div>
                <label className="block text-sm font-medium text-billio-text mb-2">
                  開始日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billio-blue"
                />
              </div>

              {/* 終了日 */}
              <div>
                <label className="block text-sm font-medium text-billio-text mb-2">
                  終了日（オプション）
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billio-blue"
                />
                <p className="text-xs text-billio-text-muted mt-1">
                  未指定の場合は無期限で実行されます
                </p>
              </div>

              {/* 明細 */}
              <div>
                <label className="block text-sm font-medium text-billio-text mb-2">
                  請求明細 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="項目名"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(index, "name", e.target.value)
                          }
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billio-blue"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="数量"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", parseInt(e.target.value) || 1)
                          }
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billio-blue"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          placeholder="単価"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(index, "unitPrice", parseInt(e.target.value) || 0)
                          }
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billio-blue"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="税率"
                          min="0"
                          max="100"
                          value={item.taxRate || 10}
                          onChange={(e) =>
                            updateItem(index, "taxRate", parseInt(e.target.value) || 10)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billio-blue"
                        />
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-2 text-sm text-billio-blue hover:text-billio-blue-dark"
                >
                  + 明細を追加
                </button>
              </div>

              {/* 備考 */}
              <div>
                <label className="block text-sm font-medium text-billio-text mb-2">
                  備考
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-billio-blue"
                />
              </div>

            {/* ボタン */}
            <DialogFooter>
              <button
                type="button"
                onClick={() => handleCloseDialog(false)}
                className="px-4 py-2 text-billio-text-muted hover:text-billio-text transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-billio-blue to-billio-green text-white rounded-lg font-semibold hover:from-billio-blue-dark hover:to-billio-green-dark transition-all shadow-sm disabled:opacity-50"
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
