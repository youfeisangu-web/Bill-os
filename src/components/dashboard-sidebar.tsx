"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, LayoutDashboard, FileText, ClipboardList, Users, DollarSign, Calendar, Settings, Receipt } from "lucide-react";
import { getTenantGroups } from "@/app/actions/tenant-group";
import { useEffect, useState } from "react";

type TenantGroup = {
  id: string;
  name: string;
  tenants: { id: string }[];
};

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [groups, setGroups] = useState<TenantGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    // URLパラメータからgroupIdを取得
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get("groupId");
    setSelectedGroupId(groupId);

    // フォルダ一覧を取得
    getTenantGroups().then(setGroups);
  }, []);

  return (
    <aside className="w-64 flex flex-col shrink-0 glass-panel border-r border-slate-200/80 px-4 py-6">
      {/* ロゴ部分 */}
      <div className="px-3 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-billio-blue to-billio-green flex items-center justify-center shadow-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-billio-text">Billio</span>
        </div>
        <p className="text-xs text-billio-text-muted">請求管理システム</p>
      </div>

      {/* メインメニュー */}
      <nav className="flex-1 overflow-y-auto">
        <div className="mb-4 space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
              pathname === "/dashboard"
                ? "bg-gradient-to-r from-billio-blue/15 to-billio-green/10 text-billio-blue border-l-4 border-billio-blue font-medium"
                : "hover:bg-white/60 text-billio-text-muted"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>ダッシュボード</span>
          </Link>
          <Link
            href="/dashboard/invoices"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
              pathname?.startsWith("/dashboard/invoices")
                ? "bg-gradient-to-r from-billio-blue/15 to-billio-green/10 text-billio-blue border-l-4 border-billio-blue font-medium"
                : "hover:bg-white/60 text-billio-text-muted"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>請求書</span>
          </Link>
          <Link
            href="/dashboard/quotes"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
              pathname?.startsWith("/dashboard/quotes")
                ? "bg-gradient-to-r from-billio-blue/15 to-billio-green/10 text-billio-blue border-l-4 border-billio-blue font-medium"
                : "hover:bg-white/60 text-billio-text-muted"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>見積書</span>
          </Link>
          <Link
            href="/dashboard/clients"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
              pathname?.startsWith("/dashboard/clients")
                ? "bg-gradient-to-r from-billio-blue/15 to-billio-green/10 text-billio-blue border-l-4 border-billio-blue font-medium"
                : "hover:bg-white/60 text-billio-text-muted"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>取引先</span>
          </Link>
          <Link
            href="/dashboard/tenants"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
              pathname?.startsWith("/dashboard/tenants")
                ? "bg-gradient-to-r from-billio-blue/15 to-billio-green/10 text-billio-blue border-l-4 border-billio-blue font-medium"
                : "hover:bg-white/60 text-billio-text-muted"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>月額管理</span>
          </Link>
          <Link
            href="/dashboard/expenses"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
              pathname?.startsWith("/dashboard/expenses")
                ? "bg-gradient-to-r from-billio-blue/15 to-billio-green/10 text-billio-blue border-l-4 border-billio-blue font-medium"
                : "hover:bg-white/60 text-billio-text-muted"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>経費</span>
          </Link>
          <Link
            href="/dashboard/recurring"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
              pathname?.startsWith("/dashboard/recurring")
                ? "bg-gradient-to-r from-billio-blue/15 to-billio-green/10 text-billio-blue border-l-4 border-billio-blue font-medium"
                : "hover:bg-white/60 text-billio-text-muted"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>定期請求</span>
          </Link>
          <Link
            href="/reconcile"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
              pathname === "/reconcile"
                ? "bg-gradient-to-r from-billio-blue/15 to-billio-green/10 text-billio-blue border-l-4 border-billio-blue font-medium"
                : "hover:bg-white/60 text-billio-text-muted"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>入金消込</span>
          </Link>
        </div>

        {/* 設定（下部） */}
        <div className="mt-auto pt-4 border-t border-slate-200/80">
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
              pathname?.startsWith("/dashboard/settings")
                ? "bg-gradient-to-r from-billio-blue/15 to-billio-green/10 text-billio-blue border-l-4 border-billio-blue font-medium"
                : "hover:bg-white/60 text-billio-text-muted"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>設定</span>
          </Link>
        </div>
      </nav>

    </aside>
  );
}
