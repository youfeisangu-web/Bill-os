"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  ClipboardList,
  Users,
  DollarSign,
  Settings,
  Receipt,
  BarChart3,
  TrendingUp,
  X,
  CreditCard,
} from "lucide-react";
import { getTenantGroups } from "@/app/actions/tenant-group";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type TenantGroup = {
  id: string;
  name: string;
  tenants: { id: string }[];
};

const navItems = [
  { href: "/dashboard", label: "ホーム", icon: LayoutDashboard },
  { href: "/dashboard/invoices", label: "請求書", icon: FileText },
  { href: "/dashboard/quotes", label: "見積書", icon: ClipboardList },
  { href: "/dashboard/clients", label: "取引先", icon: Users },
  { href: "/dashboard/tenants", label: "月額・定期請求", icon: DollarSign },
  { href: "/dashboard/expenses", label: "経費", icon: Receipt },
  { href: "/dashboard/bills", label: "支払管理", icon: CreditCard },
  { href: "/dashboard/finance", label: "財務", icon: TrendingUp },
  { href: "/dashboard/aging", label: "エイジング", icon: BarChart3 },
  { href: "/reconcile", label: "入金消込", icon: Sparkles },
] as const;

type DashboardSidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export default function DashboardSidebar({
  open = true,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [groups, setGroups] = useState<TenantGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get("groupId");
    setSelectedGroupId(groupId);
    getTenantGroups().then(setGroups);
  }, []);

  useEffect(() => {
    onClose?.();
  }, [pathname]);

  return (
    <>
      {/* モバイル: オーバーレイ（サイドバー外タップで閉じる） */}
      <button
        type="button"
        aria-label="メニューを閉じる"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />
      <aside
        className={cn(
          "w-[260px] flex flex-col shrink-0 bg-white border-r border-gray-100",
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:shadow-xl",
          "max-md:transition-transform max-md:duration-200 max-md:ease-out",
          open ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        )}
      >
      {/* ロゴエリア + モバイル閉じるボタン */}
      <div className="px-5 pt-8 pb-6 border-b border-black/[0.06] flex items-center justify-between gap-3">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="w-14 h-14 flex items-center justify-center overflow-hidden shrink-0 bg-transparent">
            <Image
              src="/logo.png"
              alt="Billia"
              width={56}
              height={56}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="text-lg font-semibold tracking-tight text-billia-text">
              Billia
            </span>
            <p className="text-[11px] text-billia-text-muted tracking-wide mt-0.5">
              請求管理
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="メニューを閉じる"
          className="md:hidden p-2 rounded-lg text-billia-text-muted hover:bg-black/[0.04] hover:text-billia-text"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* メインナビ */}
      <nav className="flex-1 overflow-y-auto py-5 px-3">
        <p className="billia-label px-3 mb-3 text-billia-text-muted">メニュー</p>
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
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-colors duration-150
                    ${
                      isActive
                        ? "bg-billia-blue/10 text-billia-blue font-medium"
                        : "text-billia-text-muted hover:bg-black/[0.04] hover:text-billia-text"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? "text-billia-blue" : "text-billia-text-muted"
                    }`}
                  />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 pt-4 border-t border-black/[0.06]">
          <p className="billia-label px-3 mb-3 text-billia-text-muted">アカウント</p>
          <Link
            href="/dashboard/settings"
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-colors duration-150
              ${
                pathname?.startsWith("/dashboard/settings")
                  ? "bg-billia-blue/10 text-billia-blue font-medium"
                  : "text-billia-text-muted hover:bg-black/[0.04] hover:text-billia-text"
              }
            `}
          >
            <Settings
              className={`w-5 h-5 shrink-0 ${
                pathname?.startsWith("/dashboard/settings")
                  ? "text-billia-blue"
                  : "text-billia-text-muted"
              }`}
            />
            <span>設定</span>
          </Link>
        </div>
      </nav>
    </aside>
    </>
  );
}
