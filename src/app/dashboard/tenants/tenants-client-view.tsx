"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getTenantGroups,
  createTenantGroup,
  deleteTenantGroup,
} from "@/app/actions/tenant-group";
import {
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantsByGroup,
} from "@/app/actions/tenant";
import { Plus, Folder, FolderOpen, Trash2, Pencil, DollarSign, AlertTriangle, Calendar } from "lucide-react";

type TenantGroup = {
  id: string;
  name: string;
  tenants: { id: string }[];
};

type Tenant = {
  id: string;
  name: string;
  nameKana: string;
  amount: number;
  groupId: string | null;
};

type TenantsClientViewProps = {
  groups: TenantGroup[];
  tenants: Tenant[];
  selectedGroupId: string | null;
  currentMonth: string;
  collectedAmount: number;
  unpaidAmount: number;
  overdueCount: number;
};

export default function TenantsClientView({
  groups: initialGroups,
  tenants: initialTenants,
  selectedGroupId: initialSelectedGroupId,
  currentMonth,
  collectedAmount,
  unpaidAmount,
  overdueCount,
}: TenantsClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [groups, setGroups] = useState<TenantGroup[]>(initialGroups);
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    initialSelectedGroupId
  );
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showNewTenantDialog, setShowNewTenantDialog] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantNameKana, setNewTenantNameKana] = useState("");
  const [newTenantAmount, setNewTenantAmount] = useState("");

  const loadGroups = async () => {
    try {
      const data = await getTenantGroups();
      setGroups(data);
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  };

  const loadTenants = async (groupId: string | null) => {
    try {
      const groupTenants = await getTenantsByGroup(groupId);
      setTenants(groupTenants);
    } catch (error) {
      console.error("Error loading tenants:", error);
    }
  };

  const handleGroupSelect = (groupId: string | null) => {
    setSelectedGroupId(groupId);
    const params = new URLSearchParams();
    if (groupId) {
      params.set("groupId", groupId);
    }
    router.push(`/dashboard/tenants?${params.toString()}`);
  };

  useEffect(() => {
    const groupId = searchParams.get("groupId");
    setSelectedGroupId(groupId);
    if (groupId) {
      loadTenants(groupId);
    } else {
      loadTenants(null);
    }
  }, [searchParams]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert("フォルダ名を入力してください");
      return;
    }

    const formData = new FormData();
    formData.append("name", newGroupName.trim());

    const result = await createTenantGroup(formData);
    if (result.success) {
      setNewGroupName("");
      setShowNewGroupDialog(false);
      await loadGroups();
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (
      !confirm(
        "このフォルダを削除しますか？フォルダ内の取引先はフォルダなしになります。"
      )
    ) {
      return;
    }

    const result = await deleteTenantGroup(id);
    if (result.success) {
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
        router.push("/dashboard/tenants");
      }
      await loadGroups();
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const handleCreateTenant = async () => {
    if (
      !newTenantName.trim() ||
      !newTenantNameKana.trim() ||
      !newTenantAmount.trim()
    ) {
      alert("すべての項目を入力してください");
      return;
    }

    const formData = new FormData();
    formData.append("name", newTenantName.trim());
    formData.append("nameKana", newTenantNameKana.trim());
    formData.append("amount", newTenantAmount.trim());
    if (selectedGroupId) {
      formData.append("groupId", selectedGroupId);
    }

    const result = await createTenant(formData);
    if (result.success) {
      setNewTenantName("");
      setNewTenantNameKana("");
      setNewTenantAmount("");
      setShowNewTenantDialog(false);
      await loadTenants(selectedGroupId);
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const handleUpdateTenant = async () => {
    if (!editingTenant) return;

    if (
      !newTenantName.trim() ||
      !newTenantNameKana.trim() ||
      !newTenantAmount.trim()
    ) {
      alert("すべての項目を入力してください");
      return;
    }

    const formData = new FormData();
    formData.append("id", editingTenant.id);
    formData.append("name", newTenantName.trim());
    formData.append("nameKana", newTenantNameKana.trim());
    formData.append("amount", newTenantAmount.trim());
    if (selectedGroupId) {
      formData.append("groupId", selectedGroupId);
    }

    const result = await updateTenant(formData);
    if (result.success) {
      setEditingTenant(null);
      setNewTenantName("");
      setNewTenantNameKana("");
      setNewTenantAmount("");
      await loadTenants(selectedGroupId);
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除してもよろしいですか？`)) {
      return;
    }

    const result = await deleteTenant(id);
    if (result.success) {
      await loadTenants(selectedGroupId);
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const startEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setNewTenantName(tenant.name);
    setNewTenantNameKana(tenant.nameKana);
    setNewTenantAmount(tenant.amount.toString());
    setShowNewTenantDialog(true);
  };

  // 月の表示名を取得（"2026-01" → "2026年1月"）
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    return `${year}年${month}月`;
  };

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <header className="flex flex-col gap-3 md:gap-4 rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            月額管理
          </p>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            月額管理
          </h1>
        </div>
        <p className="text-sm text-slate-600">
          月額請求を管理する取引先を登録・管理できます。
        </p>
      </header>

      {/* 統計情報カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* 集金金額 */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-billia-green/20 to-billia-blue/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-billia-green" />
            </div>
          </div>
          <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 md:mb-2">
            {formatMonth(currentMonth)}分 集金金額
          </p>
          <p className="text-2xl md:text-3xl font-bold text-slate-900">
            ¥{collectedAmount.toLocaleString()}
          </p>
        </div>

        {/* 未収金額 */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 md:mb-2">
            未収金額
          </p>
          <p className="text-2xl md:text-3xl font-bold text-orange-600">
            ¥{unpaidAmount.toLocaleString()}
          </p>
        </div>

        {/* 期限すぎ件数 */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
            </div>
          </div>
          <p className="text-[11px] uppercase tracking-wider text-red-700 mb-1.5 md:mb-2">
            期限すぎ件数
          </p>
          <p className="text-2xl md:text-3xl font-bold text-red-700">
            {overdueCount}件
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左サイドバー：プロジェクト一覧 */}
        <div className="lg:col-span-1">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">プロジェクト</h2>
              <button
                onClick={() => setShowNewGroupDialog(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus className="w-3 h-3" />
                追加
              </button>
            </div>

            <div className="space-y-1">
              {groups.map((group) => {
                const isSelected = selectedGroupId === group.id;
                return (
                  <div
                    key={group.id}
                    className="flex items-center gap-2 group"
                  >
                    <button
                      onClick={() => handleGroupSelect(group.id)}
                      className={`flex-1 text-left px-3 py-2 rounded-lg transition-all ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "hover:bg-gray-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <FolderOpen className="w-4 h-4" />
                        ) : (
                          <Folder className="w-4 h-4" />
                        )}
                        <span className="text-sm">{group.name}</span>
                        <span className="text-xs text-slate-500 ml-auto">
                          ({group.tenants.length})
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:text-red-700 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 新規プロジェクトダイアログ */}
            {showNewGroupDialog && (
              <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="プロジェクト名"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateGroup();
                    }
                    if (e.key === "Escape") {
                      setShowNewGroupDialog(false);
                      setNewGroupName("");
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateGroup}
                    className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    作成
                  </button>
                  <button
                    onClick={() => {
                      setShowNewGroupDialog(false);
                      setNewGroupName("");
                    }}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右メインエリア：取引先一覧 */}
        <div className="lg:col-span-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedGroupId
                    ? groups.find((g) => g.id === selectedGroupId)?.name ||
                      "取引先一覧"
                    : "プロジェクトを選択"}
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedGroupId
                    ? "月額請求を管理する取引先を表示しています"
                    : "左のプロジェクトから選択してください"}
                </p>
              </div>
              {selectedGroupId && (
                <button
                  onClick={() => {
                    setEditingTenant(null);
                    setNewTenantName("");
                    setNewTenantNameKana("");
                    setNewTenantAmount("");
                    setShowNewTenantDialog(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  取引先を追加
                </button>
              )}
            </div>

            {/* 新規/編集取引先ダイアログ */}
            {showNewTenantDialog && (
              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">
                  {editingTenant ? "取引先を編集" : "取引先を追加"}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      取引先名
                    </label>
                    <input
                      type="text"
                      value={newTenantName}
                      onChange={(e) => setNewTenantName(e.target.value)}
                      placeholder="山田太郎"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      フリガナ
                    </label>
                    <input
                      type="text"
                      value={newTenantNameKana}
                      onChange={(e) => setNewTenantNameKana(e.target.value)}
                      placeholder="ヤマダタロウ"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      月額請求額
                    </label>
                    <input
                      type="number"
                      value={newTenantAmount}
                      onChange={(e) => setNewTenantAmount(e.target.value)}
                      placeholder="85000"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={
                        editingTenant ? handleUpdateTenant : handleCreateTenant
                      }
                      className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      {editingTenant ? "更新" : "作成"}
                    </button>
                    <button
                      onClick={() => {
                        setShowNewTenantDialog(false);
                        setEditingTenant(null);
                        setNewTenantName("");
                        setNewTenantNameKana("");
                        setNewTenantAmount("");
                      }}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 取引先一覧：モバイルはカード、PCはテーブル */}
            <div className="mt-4">
              {/* モバイルカード */}
              <div className="space-y-3 md:hidden">
                {!selectedGroupId ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    左のプロジェクトを選択してください。
                  </div>
                ) : tenants.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    まだ取引先が登録されていません。取引先を追加してください。
                  </div>
                ) : (
                  tenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900 truncate">
                          {tenant.name}
                        </p>
                        <p className="text-xs text-slate-500 shrink-0">
                          ¥{tenant.amount.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-[12px] text-slate-500">
                        {tenant.nameKana}
                      </p>
                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(tenant)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                          <Pencil className="w-3 h-3" />
                          編集
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteTenant(tenant.id, tenant.name)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm transition hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          削除
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* PCテーブル */}
              <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">契約者名</th>
                      <th className="px-4 py-3">フリガナ</th>
                      <th className="px-4 py-3">月額請求額</th>
                      <th className="px-4 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {!selectedGroupId ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-10 text-center text-sm text-slate-500"
                        >
                          左のプロジェクトを選択してください。
                        </td>
                      </tr>
                    ) : tenants.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-10 text-center text-sm text-slate-500"
                        >
                          まだ取引先が登録されていません。取引先を追加してください。
                        </td>
                      </tr>
                    ) : (
                      tenants.map((tenant) => (
                        <tr key={tenant.id} className="text-slate-700">
                          <td className="px-4 py-4 font-medium text-slate-900">
                            {tenant.name}
                          </td>
                          <td className="px-4 py-4">{tenant.nameKana}</td>
                          <td className="px-4 py-4">
                            ¥{tenant.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEdit(tenant)}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                              >
                                <Pencil className="w-3 h-3" />
                                編集
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteTenant(tenant.id, tenant.name)
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm transition hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                                削除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
