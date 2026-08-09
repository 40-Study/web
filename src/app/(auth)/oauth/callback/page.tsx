"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { useAuthStore } from "@/stores/auth.store";
import { getRoleFromToken } from "@/lib/jwt";
import { normalizeRole } from "@/lib/routes";
import { bootstrapAuthSession } from "@/components/providers/auth-session";

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setSessionToken, setRoles, setActiveRole } = useAuthStore();

  const status = searchParams.get("status");
  const accessToken = searchParams.get("access_token");
  const sessionToken = searchParams.get("session_token");
  const error = searchParams.get("error");

  useEffect(() => {
    let cancelled = false;

    const completeOAuth = async () => {
      if (error) {
        router.replace(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      switch (status) {
        case "success": {
          if (accessToken) {
            const roleFromToken = getRoleFromToken(accessToken);
            if (roleFromToken) {
              setActiveRole(normalizeRole(roleFromToken));
            }
          }
          await bootstrapAuthSession(true);
          if (cancelled) return;
          const redirect = sessionStorage.getItem("auth_redirect");
          if (redirect) {
            sessionStorage.removeItem("auth_redirect");
            router.replace(redirect);
          } else {
            router.replace("/home");
          }
          break;
        }

        case "needs_role":
          if (sessionToken) {
            setSessionToken(sessionToken);
            setRoles([]);
          }
          router.replace("/login/role");
          break;

        case "select_role":
          if (sessionToken) setSessionToken(sessionToken);
          router.replace("/login/role");
          break;

        default:
          router.replace("/login");
      }
    };

    void completeOAuth();
    return () => {
      cancelled = true;
    };
  }, [accessToken, error, router, sessionToken, setActiveRole, setRoles, setSessionToken, status]);

  return (
    <AuthCard>
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        <p className="text-sm text-gray-500">Đang xử lý đăng nhập...</p>
      </div>
    </AuthCard>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthCard>
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="text-sm text-gray-500">Đang tải...</p>
          </div>
        </AuthCard>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
