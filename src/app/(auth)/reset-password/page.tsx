"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnlockIcon } from "@/components/icons";
import { AUTH_ROUTES } from "@/lib/routes";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setError("");
    router.push(AUTH_ROUTES.RESET_PASSWORD_SUCCESS);
  };

  return (
    <AuthCard>
      <AuthIconHeader
        icon={<UnlockIcon size={32} className="text-primary-500" />}
        title="Thiết lập mật khẩu mới"
        description="Tạo mật khẩu mới cho tài khoản của bạn"
        className="mb-6"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="password"
          label="Mật khẩu mới"
          placeholder="Nhập mật khẩu mới"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12"
          required
        />
        <Input
          type="password"
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu mới"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError("");
          }}
          error={error}
          className="h-12"
          required
        />

        <PasswordChecklist password={password} />

        <Button type="submit" className="h-12 w-full">
          Đặt lại mật khẩu
        </Button>
      </form>
    </AuthCard>
  );
}
