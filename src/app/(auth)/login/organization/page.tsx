"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AUTH_ROUTES } from "@/lib/routes";

/**
 * Organization selection is now embedded in the unified role selection flow.
 * Org roles appear as "Role - OrgName" in the role selection page.
 * This page redirects to /login/role for backward compatibility.
 */
export default function LoginOrganizationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(AUTH_ROUTES.LOGIN_ROLE);
  }, [router]);

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
    </div>
  );
}
