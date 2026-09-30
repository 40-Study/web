"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SocialLoginButton } from "@/components/auth/social-login-button";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AUTH_ROUTES, getRoleHomeRoute } from "@/lib/routes";
import { getRoleFromToken } from "@/lib/jwt";
import { sanitizeRedirect } from "@/lib/safe-redirect";
import { showComingSoon } from "@/lib/toast-helpers";
import { useLogin } from "@/hooks/queries/use-auth";
import { getDeviceInfo, startOAuthFlow } from "@/services/auth.service";

export default function LoginPage() {
  const loginMutation = useLogin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Lưu redirect URL vào sessionStorage (accept-invitation, mất phiên giữa chừng). Chỉ nhận đường
  // dẫn nội bộ (chống open redirect). Vào /login KHÔNG kèm redirect hợp lệ thì xoá giá trị cũ, để
  // lần đăng nhập tài khoản/vai trò khác trong cùng tab không bị đẩy tới trang của phiên trước.
  useEffect(() => {
    const redirect = sanitizeRedirect(searchParams.get("redirect"));
    if (redirect) {
      sessionStorage.setItem("auth_redirect", redirect);
    } else {
      sessionStorage.removeItem("auth_redirect");
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { email, password, device_info: getDeviceInfo() },
      {
        onSuccess: (response) => {
          const data = response.data;

          // User chưa có role → redirect chọn role
          if (data.needs_role_registration) {
            router.push(AUTH_ROUTES.LOGIN_ROLE);
            return;
          }

          // Direct login (1 role, có access_token) → vào app
          if (data.access_token && !data.session_token) {
            const redirect = sanitizeRedirect(sessionStorage.getItem("auth_redirect"));
            sessionStorage.removeItem("auth_redirect");
            if (redirect) {
              router.push(redirect);
            } else {
              const role =
                data.active_role?.role_name || getRoleFromToken(data.access_token);
              router.push(getRoleHomeRoute(role));
            }
            return;
          }

          // Multi-role → có session_token + roles → chọn role
          if (data.session_token) {
            router.push(AUTH_ROUTES.LOGIN_ROLE);
            return;
          }

          // Fallback
          router.push(AUTH_ROUTES.LOGIN_ROLE);
        },
      }
    );
  };

  return (
    <AuthCard>
      <h2 className="mb-1 text-center text-xl font-semibold text-foreground">Đăng nhập</h2>
      <p className="mb-6 text-center text-sm text-muted-foreground">Chào mừng bạn quay trở lại</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="Email"
          placeholder="Nhập email của bạn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12"
          required
        />
        <Input
          type="password"
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12"
          required
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={setRememberMe} />
            <label htmlFor="remember-me" className="cursor-pointer">Nhớ mật khẩu</label>
          </div>
          <Link
            href={AUTH_ROUTES.FORGOT_PASSWORD}
            className="text-sm font-medium text-primary hover:text-primary"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Button
          type="submit"
          className="h-12 w-full"
          isLoading={loginMutation.isPending}
          loadingText="Đang đăng nhập..."
        >
          Đăng nhập
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">hoặc đăng nhập với</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SocialLoginButton provider="google" onClick={() => startOAuthFlow("google")} />
        <SocialLoginButton provider="facebook" onClick={() => startOAuthFlow("facebook")} />
        <SocialLoginButton provider="apple" onClick={showComingSoon} />
        <SocialLoginButton provider="github" onClick={() => startOAuthFlow("github")} />
      </div>

      <AuthFooterLink
        text="Chưa có tài khoản?"
        linkText="Đăng ký"
        href={AUTH_ROUTES.REGISTER}
        className="mt-6"
      />
    </AuthCard>
  );
}
