"use client";

import { RoleGuard } from "@/components/guards";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TeacherSidebar } from "@/components/layout";
import { useAuthStore } from "@/stores/auth.store";
import { normalizeRole } from "@/lib/routes";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeRole } = useAuthStore();

  const getRole = () => {
    const role = normalizeRole(activeRole);
    if (role === "TEACHER") return "teacher";
    if (role === "PARENT") return "parent";
    return "student";
  };

  return (
    <RoleGuard roles={["SYSTEM_ADMIN", "ORG_OWNER"]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <TeacherSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <main className="p-4 md:p-6 pb-20 md:pb-6 w-full max-w-7xl mx-auto flex-1">
            {children}
          </main>
          <BottomNav role={getRole()} />
        </div>
      </div>
    </RoleGuard>
  );
}
