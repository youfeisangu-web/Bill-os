"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  ClipboardList,
  Users,
  DollarSign,
  Calendar,
  Settings,
  Receipt,
} from "lucide-react";
import { getTenantGroups } from "@/app/actions/tenant-group";
import { useEffect, useState } from "react";

type TenantGroup = {
  id: string;
  name: string;
  tenants: { id: string }[];
};

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/dashboard/invoices", label: "請求書", icon: FileText },
  { href: "/dashboard/quotes", label: "見積書", icon: ClipboardList },
  { href: "/dashboard/clients", label: "取引先", icon: Users },
  { href: "/dashboard/tenants", label: "月額管理", icon: DollarSign },
  { href: "/dashboard/expenses", label: "経費", icon: Receipt },
  { href: "/dashboard/recurring", label: "定期請求", icon: Calendar },
  { href: "/reconcile", label: "入金消込", icon: Sparkles },
] as const;

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [groups, setGroups] = useState<TenantGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get("groupId");
    setSelectedGroupId(groupId);
    getTenantGroups().then(setGroups);
  }, []);

  return (
    <aside className="w-[280px] flex flex-col shrink-0 bg-billio-sidebar border-r border-white/[0.06]">
      {/* ロゴエリア */}
      <div className="px-6 pt-8 pb-6 border-b border-white/[0.08]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-white/10">
            <Sparkles className="h-5 w-5 text-amber-400/90" />
          </div>
          <div>
            <span className="text-lg font-semibold tracking-tight text-white">
              Billio
            </span>
            <p className="text-[11px] text-slate-400 tracking-wide mt-0.5">
              請求管理
            </p>
          </div>
        </Link>
      </div>

      {/* メインナビ */}
      <nav className="flex-1 overflow-y-auto py-5 px-4">
        <p className="billio-label px-3 mb-3 text-slate-500">メニュー</p>
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname?.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] transition-colors duration-150
                    ${
                      isActive
                        ? "bg-white/10 text-white font-medium"
                        : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? "text-amber-400/90" : "text-slate-500"
                    }`}
                  />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 pt-4 border-t border-white/[0.08]">
          <p className="billio-label px-3 mb-3 text-slate-500">アカウント</p>
          <Link
            href="/dashboard/settings"
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] transition-colors duration-150
              ${
                pathname?.startsWith("/dashboard/settings")
                  ? "bg-white/10 text-white font-medium"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
              }
            `}
          >
            <Settings
              className={`w-5 h-5 shrink-0 ${
                pathname?.startsWith("/dashboard/settings")
                  ? "text-amber-400/90"
                  : "text-slate-500"
              }`}
            />
            <span>設定</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
