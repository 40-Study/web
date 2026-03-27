"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LockIcon } from "@/components/icons";
import { AUTH_ROUTES } from "@/lib/routes";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Call API to send reset email
    await new Promise((r) => setTimeout(r, 1000)); // Simulate API call
    setIsLoading(false);
    router.push(AUTH_ROUTES.FORGOT_PASSWORD_OTP);
  };

  return (
    <AuthCard>
      <AuthIconHeader
        icon={<LockIcon size={32} className="text-amber-500" />}
        iconBgClassName="bg-amber-100"
        title="Quên mật khẩu?"
        description="Nhập email của bạn để nhận mã xác thực"
        className="mb-6"
      />

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
        <Button type="submit" className="h-12 w-full" isLoading={isLoading} loadingText="Đang gửi...">
          Gửi mã xác thực
        </Button>
      </form>

      <AuthFooterLink
        text="Quay lại"
        linkText="Đăng nhập"
        href={AUTH_ROUTES.LOGIN}
        className="mt-6"
      />
    </AuthCard>
  );
}
