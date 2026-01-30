import DashboardSidebar from "@/components/dashboard-sidebar";
import NavigationLoader from "@/components/navigation-loader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      <DashboardSidebar />
      <div className="flex-1 overflow-y-auto">{children}</div>
      <NavigationLoader />
    </div>
  );
}
