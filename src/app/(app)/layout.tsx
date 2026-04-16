"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShellLayout } from "@/components/layout/app-shell-layout";
import { RoleGuard } from "@/components/guards/role-guard";
import { useAuthStore } from "@/stores/auth.store";
import { normalizeRole, AUTH_ROUTES } from "@/lib/routes";

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
    if (!hasHydrated) return;

    // Admin roles should go to admin dashboard
    if (isAuthenticated && isAdminRole) {
      router.replace("/admin");
      return;
    }

    // Authenticated but no role → redirect to role selection
    if (isAuthenticated && !normalizedRole && !isPublicRoute) {
      router.replace(AUTH_ROUTES.LOGIN_ROLE);
    }
  }, [hasHydrated, isAuthenticated, isAdminRole, normalizedRole, isPublicRoute, router]);

  // Show nothing while redirecting to admin
  if (hasHydrated && isAuthenticated && isAdminRole) return null;

  // Public routes don't need auth
  if (isPublicRoute) {
    return <AppShellLayout>{children}</AppShellLayout>;
  }

  // Wait for hydration
  if (!hasHydrated) return null;

  // Not authenticated or no role → show nothing (redirect will happen in useEffect)
  if (!isAuthenticated || !normalizedRole) return null;

  return (
    <RoleGuard roles={["STUDENT", "TEACHER", "PARENT"]}>
      <AppShellLayout>{children}</AppShellLayout>
    </RoleGuard>
  );
}
