import { RoleGuard } from "@/components/guards";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TeacherSidebar } from "@/components/layout";

export default function TeacherRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <TeacherSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <main className="p-4 md:p-6 pb-20 md:pb-6 w-full max-w-7xl mx-auto flex-1">
            {children}
          </main>
          <BottomNav role="teacher" />
        </div>
      </div>
    </RoleGuard>
  );
}
