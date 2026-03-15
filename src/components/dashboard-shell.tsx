"use client";

import { useState } from "react";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardHeader from "./dashboard-header";
import BottomNav from "./bottom-nav";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] bg-white">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <div className="sticky top-0 z-40">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <main className="flex-1 px-4 md:px-8 py-4 pb-24 md:pb-8 dashboard-main-touch">
          {children}
        </main>
      </div>
      <BottomNav onMoreClick={() => setSidebarOpen(true)} />
    </div>
  );
}
