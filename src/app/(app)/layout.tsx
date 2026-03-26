"use client";

import { usePathname } from "next/navigation";
import { StudentLayout } from "@/components/layout/student-layout";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { RoleGuard } from "@/components/guards/role-guard";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuthStore } from "@/stores/auth.store";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  const isPublicRoute =
    pathname === "/courses" ||
    pathname.startsWith("/courses/") ||
    pathname === "/discussions" ||
    pathname.startsWith("/discussions/");

  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <StudentSidebar isAuthenticated={isAuthenticated} />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto">{children}</main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <RoleGuard roles={["STUDENT", "TEACHER", "PARENT", "SYSTEM_ADMIN", "ORG_OWNER"]}>
      <StudentLayout>{children}</StudentLayout>
    </RoleGuard>
  );
}
