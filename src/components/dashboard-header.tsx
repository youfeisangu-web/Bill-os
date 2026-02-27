"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Menu, Search, User } from "lucide-react";
import { getTenantGroups } from "@/app/actions/tenant-group";
import { useEffect, useState } from "react";

type TenantGroup = {
  id: string;
  name: string;
};

type DashboardHeaderProps = {
  onMenuClick?: () => void;
};

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const pathname = usePathname();
  const [groups, setGroups] = useState<TenantGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>("すべて");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get("groupId");
    setSelectedGroupId(groupId);
    getTenantGroups().then((list) => {
      setGroups(list);
      if (groupId) {
        const g = list.find((x) => x.id === groupId);
        setSelectedName(g?.name ?? "プロジェクト");
      } else {
        setSelectedName("すべて");
      }
    });
  }, [pathname]);

  return (
    <header
      className="shrink-0 h-[56px] md:h-[60px] flex items-center px-3 md:px-6 bg-white border-b border-gray-100"
    >
      <div className="flex items-center justify-between gap-2 md:gap-4 w-full">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="メニューを開く"
            className="md:hidden p-2 rounded-lg text-billia-text-muted hover:bg-billia-bg hover:text-billia-text"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="relative flex items-center gap-2 rounded-lg border border-billia-border-subtle bg-billia-bg px-3 md:px-4 py-2 md:py-2.5 text-sm text-billia-text min-w-0 md:min-w-[200px] max-w-[180px] md:max-w-none">
            <span className="truncate text-stone-700">プロジェクト: {selectedName}</span>
            <ChevronDown className="w-4 h-4 shrink-0 text-stone-400" />
            <select
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              value={selectedGroupId ?? ""}
              onChange={(e) => {
                const id = e.target.value || null;
                const url = id
                  ? `${pathname}?groupId=${id}`
                  : pathname?.split("?")[0] ?? "/dashboard";
                window.location.href = url;
              }}
            >
              <option value="">すべて</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden sm:flex items-center gap-2.5 rounded-lg border border-billia-border-subtle bg-billia-bg px-4 py-2.5 text-stone-400 min-w-[200px]">
            <Search className="w-4 h-4 shrink-0" />
            <input
              type="search"
              placeholder="検索"
              className="w-full bg-transparent text-sm text-stone-700 placeholder-stone-400 outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="relative p-2.5 rounded-lg text-stone-500 hover:bg-billia-bg hover:text-stone-700 transition-colors"
            aria-label="通知"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 pointer-events-none" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-billia-blue/10 flex items-center justify-center ring-1 ring-billia-blue/20">
            <User className="w-5 h-5 text-billia-blue" />
          </div>
        </div>
      </div>
    </header>
  );
}
