"use client";

import { useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LockIcon } from "@/components/icons";
import { AUTH_ROUTES } from "@/lib/routes";
import { validateEmail } from "@/lib/email-validation";
import { useResetPasswordRequest } from "@/hooks/queries/use-auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const resetPasswordRequest = useResetPasswordRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // noValidate trên <form>: lỗi hiện bằng tiếng Việt thay vì tooltip tiếng Anh của trình duyệt (PG-M3, QA2 261013).
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    const trimmed = email.trim();
    sessionStorage.setItem("reset_password_email", trimmed);
    await resetPasswordRequest.mutateAsync({ email: trimmed });
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

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          type="email"
          label="Email"
          placeholder="Nhập email của bạn"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(undefined);
          }}
          error={emailError}
          className="h-12"
          required
        />
        <Button type="submit" className="h-12 w-full" isLoading={resetPasswordRequest.isPending} loadingText="Đang gửi...">
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
