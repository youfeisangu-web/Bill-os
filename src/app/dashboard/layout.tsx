import DashboardSidebar from "@/components/dashboard-sidebar";
import DashboardHeader from "@/components/dashboard-header";
import NavigationLoader from "@/components/navigation-loader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen glass-bg min-h-0">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col min-w-0 pl-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto relative z-10 pr-8">{children}</main>
      </div>
      <NavigationLoader />
    </div>
  );
}
