"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, LineChart, BarChart3 } from "lucide-react";

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard/analytics/finance", label: "財務サマリー", icon: TrendingUp },
    { href: "/dashboard/analytics/sales", label: "売上分析", icon: LineChart },
    { href: "/dashboard/analytics/aging", label: "エイジング", icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col gap-0 py-5 md:py-8">
      <header className="flex flex-col gap-1 mb-6">
        <p className="billia-label">レポートと分析</p>
        <h1 className="text-xl font-semibold tracking-tight text-billia-text md:text-2xl">
          レポート
        </h1>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-black/[0.06] overflow-x-auto pb-px mb-6 hide-scrollbar">
        {tabs.map((tab) => {
          const active = pathname.includes(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors relative ${
                active ? "text-billia-text" : "text-billia-text-muted hover:text-billia-text"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {active && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-sm" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
