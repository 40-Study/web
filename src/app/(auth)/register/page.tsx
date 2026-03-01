"use client";

import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SocialLoginButton } from "@/components/auth/social-login-button";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { AUTH_ROUTES } from "@/lib/routes";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <AuthCard>
      <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
        Đăng ký tài khoản
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500">Chọn phương thức đăng ký</p>

      <div className="space-y-3">
        <SocialLoginButton provider="google" />
        <SocialLoginButton provider="facebook" />
        <SocialLoginButton provider="apple" />
        <SocialLoginButton provider="github" />
        <SocialLoginButton provider="email" onClick={() => router.push(AUTH_ROUTES.REGISTER_FORM)} />
      </div>

      <AuthFooterLink
        text="Bạn đã có tài khoản?"
        linkText="Đăng nhập"
        href={AUTH_ROUTES.LOGIN}
        className="mt-6"
      />
    </AuthCard>
  );
}
