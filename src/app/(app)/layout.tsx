"use client";

import { usePathname } from "next/navigation";
import { AppShellLayout } from "@/components/layout/app-shell-layout";
import { RoleGuard } from "@/components/guards/role-guard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isPublicRoute =
    pathname === "/courses" ||
    pathname.startsWith("/courses/") ||
    pathname === "/discussions" ||
    pathname.startsWith("/discussions/");

  if (isPublicRoute) {
    return <AppShellLayout>{children}</AppShellLayout>;
  }

  return (
    <RoleGuard roles={["STUDENT", "TEACHER", "PARENT", "SYSTEM_ADMIN", "ORG_OWNER"]}>
      <AppShellLayout>{children}</AppShellLayout>
    </RoleGuard>
  );
}
