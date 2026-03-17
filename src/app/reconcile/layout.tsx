import DashboardSidebar from "@/components/dashboard-sidebar";

export default function ReconcileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      <DashboardSidebar />
      <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
    </div>
  );
}
