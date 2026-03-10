"use client";

import { RoleGuard } from "@/components/guards";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useAuthStore } from "@/stores/auth.store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeRole } = useAuthStore();

  const getRole = () => {
    if (activeRole === "teacher") return "teacher";
    if (activeRole === "parent") return "parent";
    return "student";
  };

  return (
    <RoleGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardHeader />
        <main className="p-4 md:p-6 pb-20 md:pb-6 max-w-7xl mx-auto">
          {children}
        </main>
        <BottomNav role={getRole()} />
      </div>
    </RoleGuard>
  );
}
