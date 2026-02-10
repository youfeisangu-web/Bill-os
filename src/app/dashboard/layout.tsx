import DashboardSidebar from "@/components/dashboard-sidebar";
import DashboardHeader from "@/components/dashboard-header";
import NavigationLoader from "@/components/navigation-loader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex h-screen min-h-0"
      style={{
        background: "linear-gradient(135deg, #e0e7ff 0%, #f5f5ff 35%, #f0f9ff 100%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(ellipse 70% 40% at 10% 0%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(ellipse 50% 30% at 90% 100%, rgba(59,130,246,0.12) 0%, transparent 50%)",
        }}
      />
      <DashboardSidebar />
      <div className="flex flex-1 flex-col min-w-0 relative z-10">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto pr-8">{children}</main>
      </div>
      <NavigationLoader />
    </div>
  );
}
