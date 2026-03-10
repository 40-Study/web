"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { SocialLoginButton } from "@/components/auth/social-login-button";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTH_ROUTES } from "@/lib/routes";
import { useLogin } from "@/hooks/queries/use-auth";

export default function LoginPage() {
  const loginMutation = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      email,
      password,
      device_name: navigator.userAgent.slice(0, 50),
    });
  };

  return (
    <AuthCard>
      <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">Đăng nhập</h2>
      <p className="mb-6 text-center text-sm text-gray-500">Chào mừng bạn quay trở lại</p>

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
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Nhớ mật khẩu
          </label>
          <Link
            href={AUTH_ROUTES.FORGOT_PASSWORD}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Button
          type="submit"
          className="h-12 w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">hoặc đăng nhập với</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <SocialLoginButton provider="google" />
        <SocialLoginButton provider="facebook" />
        <SocialLoginButton provider="apple" />
        <SocialLoginButton provider="github" />
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
