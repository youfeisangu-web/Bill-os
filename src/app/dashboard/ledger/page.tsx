import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTenantGroups } from "@/app/actions/tenant-group";
import { getPaymentStatusesByGroup } from "@/app/actions/payment-status";
import { CheckCircle2, XCircle, AlertCircle, Calendar } from "lucide-react";

type Props = {
  searchParams: Promise<{ groupId?: string; month?: string }>;
};

export default async function LedgerPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const params = await searchParams;
  const selectedGroupId = params.groupId || null;
  const selectedMonth = params.month || null;

  // フォルダ一覧を取得
  const groups = await getTenantGroups();

  // 月次入金台帳を取得
  const paymentStatuses = await getPaymentStatusesByGroup(selectedGroupId);

  // 月でフィルタリング（指定がある場合）
  const filteredStatuses = selectedMonth
    ? paymentStatuses.filter((ps) => ps.targetMonth === selectedMonth)
    : paymentStatuses;

  // 月の一覧を取得（重複を除去）
  const months = Array.from(
    new Set(paymentStatuses.map((ps) => ps.targetMonth))
  ).sort()
    .reverse(); // 新しい月から

  // ステータスの表示用
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            支払済み
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            <AlertCircle className="w-3 h-3" />
            部分払い
          </span>
        );
      case "UNPAID":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            <XCircle className="w-3 h-3" />
            未払い
          </span>
        );
      default:
        return null;
    }
  };

  // 月の表示名を取得（"2026-01" → "2026年1月"）
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    return `${year}年${parseInt(month)}月`;
  };

  return (
    <div className="min-h-screen bg-billio-bg">
      {/* ヘッダー */}
      <header className="bg-billio-card border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-billio-text">
              月次入金台帳
            </h1>
            <p className="text-sm text-billio-text-muted mt-1">
              取引先ごとの月次入金状況を管理
            </p>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* フィルター */}
        <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-billio-text-muted" />
              <span className="text-sm font-medium text-billio-text">月を選択:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/dashboard/ledger${selectedGroupId ? `?groupId=${selectedGroupId}` : ""}`}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  !selectedMonth
                    ? "bg-billio-blue text-white"
                    : "bg-gray-100 text-billio-text-muted hover:bg-gray-200"
                }`}
              >
                すべて
              </a>
              {months.map((month) => (
                <a
                  key={month}
                  href={`/dashboard/ledger?month=${month}${selectedGroupId ? `&groupId=${selectedGroupId}` : ""}`}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedMonth === month
                      ? "bg-billio-blue text-white"
                      : "bg-gray-100 text-billio-text-muted hover:bg-gray-200"
                  }`}
                >
                  {formatMonth(month)}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* 月次入金台帳テーブル */}
        <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-billio-text">
              {selectedMonth ? formatMonth(selectedMonth) : "全期間"}の入金状況
            </h2>
          </div>

          {filteredStatuses.length === 0 ? (
            <div className="p-8 text-center text-billio-text-muted">
              データがありません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-billio-text uppercase tracking-wider">
                      取引先名
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-billio-text uppercase tracking-wider">
                      対象月
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-billio-text uppercase tracking-wider">
                      請求額
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-billio-text uppercase tracking-wider">
                      入金額
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-billio-text uppercase tracking-wider">
                      残額
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-billio-text uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-billio-text uppercase tracking-wider">
                      入金回数
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStatuses.map((status) => {
                    const remaining = status.expectedAmount - status.paidAmount;
                    const paymentCount = status.payments.length;

                    return (
                      <tr key={status.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-billio-text">
                            {status.tenant.name}
                          </div>
                          <div className="text-xs text-billio-text-muted">
                            {status.tenant.nameKana}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-billio-text">
                          {formatMonth(status.targetMonth)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-billio-text">
                          ¥{status.expectedAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-billio-text">
                          ¥{status.paidAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={
                              remaining > 0
                                ? "text-orange-600 font-medium"
                                : "text-green-600"
                            }
                          >
                            {remaining > 0
                              ? `¥${remaining.toLocaleString()}`
                              : "¥0"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(status.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-billio-text-muted">
                          {paymentCount}回
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* サマリーカード */}
        {filteredStatuses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wider text-billio-text-muted mb-1">
                総請求額
              </p>
              <p className="text-xl font-bold text-billio-text">
                ¥
                {filteredStatuses
                  .reduce((sum, s) => sum + s.expectedAmount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wider text-billio-text-muted mb-1">
                総入金額
              </p>
              <p className="text-xl font-bold text-billio-text">
                ¥
                {filteredStatuses
                  .reduce((sum, s) => sum + s.paidAmount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wider text-billio-text-muted mb-1">
                総残額
              </p>
              <p className="text-xl font-bold text-orange-600">
                ¥
                {filteredStatuses
                  .reduce(
                    (sum, s) => sum + (s.expectedAmount - s.paidAmount),
                    0
                  )
                  .toLocaleString()}
              </p>
            </div>
            <div className="bg-billio-card rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wider text-billio-text-muted mb-1">
                回収率
              </p>
              <p className="text-xl font-bold text-billio-text">
                {(() => {
                  const totalExpected = filteredStatuses.reduce(
                    (sum, s) => sum + s.expectedAmount,
                    0
                  );
                  const totalPaid = filteredStatuses.reduce(
                    (sum, s) => sum + s.paidAmount,
                    0
                  );
                  return totalExpected > 0
                    ? `${Math.round((totalPaid / totalExpected) * 100)}%`
                    : "0%";
                })()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
