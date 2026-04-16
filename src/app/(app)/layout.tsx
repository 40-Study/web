"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShellLayout } from "@/components/layout/app-shell-layout";
import { RoleGuard } from "@/components/guards/role-guard";
import { useAuthStore } from "@/stores/auth.store";
import { normalizeRole } from "@/lib/routes";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, hasHydrated, activeRole } = useAuthStore();
  const normalizedRole = normalizeRole(activeRole);
  const isAdminRole = normalizedRole === "SYSTEM_ADMIN" || normalizedRole === "ORG_OWNER";

  const isPublicRoute =
    pathname === "/courses" ||
    pathname.startsWith("/courses/") ||
    pathname === "/discussions" ||
    pathname.startsWith("/discussions/") ||
    pathname.startsWith("/profile/") ||
    pathname === "/contests" ||
    pathname.startsWith("/contests/");

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !isAdminRole) return;
    router.replace("/admin");
  }, [hasHydrated, isAuthenticated, isAdminRole, router]);

  if (hasHydrated && isAuthenticated && isAdminRole) return null;

  if (isPublicRoute) {
    return <AppShellLayout>{children}</AppShellLayout>;
  }

  if (!hasHydrated) return null;

  return (
    <RoleGuard roles={["STUDENT", "TEACHER", "PARENT"]}>
      <AppShellLayout>{children}</AppShellLayout>
    </RoleGuard>
  );
}
