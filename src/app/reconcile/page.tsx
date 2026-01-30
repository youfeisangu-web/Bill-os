'use client';

import { useState, useEffect } from 'react';
import { savePayment, getPaymentsByTenant } from '@/app/actions/payment';
import { getTenantGroups, createTenantGroup, deleteTenantGroup } from '@/app/actions/tenant-group';
import { createTenant, getTenantsByGroup } from '@/app/actions/tenant';
import type { ReconcileResult } from '@/types/reconcile';
import { Plus, Folder, FolderOpen, Trash2, Upload } from 'lucide-react';

type TenantGroup = {
  id: string;
  name: string;
  createdAt: Date;
  tenants: { id: string }[];
};

type Tenant = {
  id: string;
  name: string;
  nameKana: string;
  amount: number;
  groupId: string | null;
};

type Payment = {
  id: string;
  amount: number;
  date: Date;
  note: string | null;
};

export default function ReconcilePage() {
  const [groups, setGroups] = useState<TenantGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Record<string, Payment[]>>({});
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<ReconcileResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedRows, setSavedRows] = useState<Set<number>>(new Set());
  const [savingRows, setSavingRows] = useState<Set<number>>(new Set());
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewTenantDialog, setShowNewTenantDialog] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantNameKana, setNewTenantNameKana] = useState('');
  const [newTenantAmount, setNewTenantAmount] = useState('');

  // フォルダ一覧を取得
  useEffect(() => {
    loadGroups();
  }, []);

  // 選択したフォルダの入居者を取得
  useEffect(() => {
    if (selectedGroupId) {
      loadTenants(selectedGroupId);
    } else {
      setTenants([]);
      setPayments({});
    }
  }, [selectedGroupId]);

  const loadGroups = async () => {
    try {
      const data = await getTenantGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadTenants = async (groupId: string) => {
    try {
      const groupTenants = await getTenantsByGroup(groupId);
      setTenants(groupTenants);
      
      // 各入居者の入金履歴を取得
      const paymentsMap: Record<string, Payment[]> = {};
      for (const tenant of groupTenants) {
        const tenantPayments = await getPaymentsByTenant(tenant.id);
        paymentsMap[tenant.id] = tenantPayments;
      }
      setPayments(paymentsMap);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert('フォルダ名を入力してください');
      return;
    }

    const formData = new FormData();
    formData.append('name', newGroupName.trim());

    const result = await createTenantGroup(formData);
    if (result.success) {
      setNewGroupName('');
      setShowNewGroupDialog(false);
      loadGroups();
    } else {
      alert(result.message);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('このフォルダを削除しますか？フォルダ内の入居者はフォルダなしになります。')) {
      return;
    }

    const result = await deleteTenantGroup(id);
    if (result.success) {
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
      }
      loadGroups();
    } else {
      alert(result.message);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenantName.trim() || !newTenantNameKana.trim() || !newTenantAmount.trim()) {
      alert('すべての項目を入力してください');
      return;
    }

    const formData = new FormData();
    formData.append('name', newTenantName.trim());
    formData.append('nameKana', newTenantNameKana.trim());
    formData.append('amount', newTenantAmount.trim());
    if (selectedGroupId) {
      formData.append('groupId', selectedGroupId);
    }

    const result = await createTenant(formData);
    if (result.success) {
      setNewTenantName('');
      setNewTenantNameKana('');
      setNewTenantAmount('');
      setShowNewTenantDialog(false);
      if (selectedGroupId) {
        loadTenants(selectedGroupId);
      }
    } else {
      alert(result.message);
    }
  };

  // CSVをアップロードしてAPIに投げる処理
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setSavedRows(new Set());

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/reconcile', {
        method: 'POST',
        body: formData,
      });
      
      const json = await res.json();
      
      if (json.success) {
        setResults(json.data);
      } else {
        alert('エラーが発生しました: ' + json.error);
      }
    } catch (e) {
      alert('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 確定ボタンを押した時の処理
  const handleConfirm = async (index: number, row: ReconcileResult) => {
    if (!row.tenantId || !row.date || !row.amount) {
      alert('保存に必要な情報が不足しています');
      return;
    }

    setSavingRows(prev => new Set(prev).add(index));

    try {
      await savePayment(row.tenantId, row.amount, row.date);
      setSavedRows(prev => new Set(prev).add(index));
      // 入金履歴を再取得
      if (selectedGroupId) {
        loadTenants(selectedGroupId);
      }
    } catch (error) {
      alert('保存に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
    } finally {
      setSavingRows(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  // 今月の入金状況を計算
  const getCurrentMonthPayments = (tenantId: string) => {
    const tenantPayments = payments[tenantId] || [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return tenantPayments.filter(p => {
      const paymentDate = new Date(p.date);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });
  };

  return (
    <div className="flex h-full bg-billio-bg">
      {/* 左側：フォルダ一覧（入金消込用） */}
      <div className="w-64 bg-billio-card border-r border-gray-200 shadow-sm flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">フォルダ</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {groups.map((group) => (
            <div
              key={group.id}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all mb-1 ${
                selectedGroupId === group.id
                  ? 'bg-gradient-to-r from-billio-blue/10 to-billio-green/10 text-billio-blue border-l-4 border-billio-blue font-medium'
                  : 'hover:bg-gray-50 text-billio-text-muted'
              }`}
              onClick={() => setSelectedGroupId(group.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {selectedGroupId === group.id ? (
                  <FolderOpen className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <Folder className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="truncate font-medium">{group.name}</span>
                <span className="text-xs text-gray-500">({group.tenants.length})</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteGroup(group.id);
                }}
                className="p-1 hover:bg-red-100 rounded text-red-600 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 右側：メインコンテンツ */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {selectedGroupId ? (
          <div className="p-6">
            {/* 右側ヘッダー：フォルダ追加・入居者追加 */}
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {groups.find(g => g.id === selectedGroupId)?.name || 'フォルダ'}
                </h1>
                <p className="text-sm text-gray-600">
                  {tenants.length}名の入居者
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewGroupDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  <Plus className="w-4 h-4" />
                  フォルダ追加
                </button>
                <button
                  onClick={() => setShowNewTenantDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  入居者追加
                </button>
              </div>
            </div>

            {/* 入居者リスト */}
            <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">入居者一覧</h2>
              </div>

              <div className="divide-y divide-gray-200">
                {tenants.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    入居者が登録されていません
                  </div>
                ) : (
                  tenants.map((tenant) => {
                    const currentMonthPayments = getCurrentMonthPayments(tenant.id);
                    const totalAmount = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);

                    return (
                      <div key={tenant.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">{tenant.name}</div>
                            <div className="text-sm text-gray-500">{tenant.nameKana}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              家賃: ¥{tenant.amount.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">今月の入金</div>
                            <div className={`text-lg font-bold ${
                              totalAmount >= tenant.amount ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              ¥{totalAmount.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {currentMonthPayments.length}件
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* CSVアップロードエリア */}
            <div className="bg-billio-card p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
              <h2 className="text-lg font-semibold text-billio-text mb-4">入金消込（AIマッチング）</h2>
              <div className="flex items-center gap-4">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block flex-1 text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-billio-blue to-billio-green text-white px-6 py-2 rounded-lg font-bold hover:from-billio-blue-dark hover:to-billio-green-dark disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  {loading ? 'AI解析中...' : '解析実行'}
                </button>
              </div>
            </div>

            {/* 結果表示エリア */}
            {results.length > 0 && (
              <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">消込結果</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-900">日付</th>
                        <th className="px-4 py-3 font-semibold text-gray-900">入金名義 (CSV)</th>
                        <th className="px-4 py-3 font-semibold text-gray-900">金額</th>
                        <th className="px-4 py-3 font-semibold text-gray-900">判定</th>
                        <th className="px-4 py-3 font-semibold text-gray-900">AIコメント</th>
                        <th className="px-4 py-3 font-semibold text-gray-900">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {results.map((row, i) => {
                        const isSaved = savedRows.has(i);
                        const isSaving = savingRows.has(i);
                        const canConfirm = row.status === '完了' && row.tenantId && !isSaved;

                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-600">{row.date}</td>
                            <td className="px-4 py-3 text-gray-800 font-mono">{row.rawName}</td>
                            <td className="px-4 py-3 text-gray-800">¥{row.amount.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                row.status === '完了' ? 'bg-green-100 text-green-800' : 
                                row.status === 'エラー' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {row.message}
                            </td>
                            <td className="px-4 py-3">
                              {canConfirm ? (
                                <button
                                  onClick={() => handleConfirm(i, row)}
                                  disabled={isSaving}
                                  className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-billio-blue to-billio-green rounded-lg hover:from-billio-blue-dark hover:to-billio-green-dark disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                  {isSaving ? '保存中...' : '確定'}
                                </button>
                              ) : isSaved ? (
                                <span className="px-4 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg">
                                  保存済み
                                </span>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 p-6">
            <div className="text-center">
              <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">フォルダを選択してください</p>
              <p className="text-sm mt-2 mb-6">左側のフォルダ一覧から選択するか、新しいフォルダを作成してください</p>
              <button
                onClick={() => setShowNewGroupDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                フォルダ追加
              </button>
            </div>
          </div>
        )}
      </div>

      {/* フォルダ作成ダイアログ */}
      {showNewGroupDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-gray-900 mb-4">新しいフォルダ</h3>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="フォルダ名を入力"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowNewGroupDialog(false);
                  setNewGroupName('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 入居者追加ダイアログ */}
      {showNewTenantDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-gray-900 mb-4">新しい入居者</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">契約者名</label>
                <input
                  type="text"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="山田太郎"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">フリガナ</label>
                <input
                  type="text"
                  value={newTenantNameKana}
                  onChange={(e) => setNewTenantNameKana(e.target.value)}
                  placeholder="ヤマダタロウ"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">家賃金額</label>
                <input
                  type="number"
                  value={newTenantAmount}
                  onChange={(e) => setNewTenantAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  setShowNewTenantDialog(false);
                  setNewTenantName('');
                  setNewTenantNameKana('');
                  setNewTenantAmount('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateTenant}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                登録
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
