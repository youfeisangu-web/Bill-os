"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Search, User } from "lucide-react";
import { getTenantGroups } from "@/app/actions/tenant-group";
import { useEffect, useState } from "react";

type TenantGroup = {
  id: string;
  name: string;
};

export default function DashboardHeader() {
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
    <header className="glass-panel shrink-0 border-b border-slate-200/80 px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/60 px-4 py-2 text-sm text-slate-700 shadow-sm min-w-[200px]">
            <span className="truncate">プロジェクト: {selectedName}</span>
            <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
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
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/60 px-4 py-2 text-slate-400 min-w-[180px]">
            <Search className="w-4 h-4 shrink-0" />
            <input
              type="search"
              placeholder="検索"
              className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="relative p-2 rounded-lg text-slate-600 hover:bg-white/60 transition-colors"
            aria-label="通知"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-billio-blue to-billio-green flex items-center justify-center shadow-sm">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
