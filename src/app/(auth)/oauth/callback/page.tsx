"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { useAuthStore } from "@/stores/auth.store";
import { getRoleFromToken } from "@/lib/jwt";
import { normalizeRole } from "@/lib/routes";

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setToken, setSessionToken, setRoles, setActiveRole, login } = useAuthStore();

  const status = searchParams.get("status");
  const accessToken = searchParams.get("access_token");
  const sessionToken = searchParams.get("session_token");
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    switch (status) {
      case "success":
        // Có token → lưu store → redirect home (trang home sẽ fetch user info)
        if (accessToken) {
          setToken(accessToken);
          // Parse và set activeRole từ JWT token
          const roleFromToken = getRoleFromToken(accessToken);
          if (roleFromToken) {
            setActiveRole(normalizeRole(roleFromToken));
          }
          login({ id: "", email: "", name: "" }); // mark authenticated, getMe sẽ fill đúng sau
        }
        // Check pending redirect
        const redirect = sessionStorage.getItem("auth_redirect");
        if (redirect) {
          sessionStorage.removeItem("auth_redirect");
          router.replace(redirect);
        } else {
          router.replace("/home");
        }
        break;

      case "needs_role":
        // User mới, chưa có role → lưu session token → sang chọn role
        if (sessionToken) {
          setSessionToken(sessionToken);
          setRoles([]); // đảm bảo login/role page hiểu là 0 roles
        }
        router.replace("/login/role");
        break;

      case "select_role":
        // User cũ, nhiều roles → lưu session token → sang chọn role
        if (sessionToken) {
          setSessionToken(sessionToken);
        }
        router.replace("/login/role");
        break;

      default:
        router.replace("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
