"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  FilePlus,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

const navItems = [
  { label: "ホーム", href: "/dashboard", icon: LayoutDashboard },
  { label: "取引先", href: "/dashboard/clients", icon: Users },
  { label: "見積書", href: "/dashboard/quotes", icon: FilePlus },
  { label: "請求書", href: "/dashboard/invoices", icon: FileText },
  { label: "経費", href: "/dashboard/expenses", icon: CreditCard },
  { label: "設定", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-950 lg:flex">
      <div className="px-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
          Bill OS
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
          ダッシュボード
        </p>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 transition ${
                isActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
