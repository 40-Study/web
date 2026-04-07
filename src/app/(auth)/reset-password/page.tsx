"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnlockIcon } from "@/components/icons";
import { AUTH_ROUTES } from "@/lib/routes";
import { useResetPassword } from "@/hooks/queries/use-auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const resetPassword = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    const email = sessionStorage.getItem("reset_password_email");
    const otp = sessionStorage.getItem("reset_password_otp");
    if (!email || !otp) {
      toast.error("Phiên đặt lại mật khẩu đã hết hạn");
      router.push(AUTH_ROUTES.FORGOT_PASSWORD);
      return;
    }

    setError("");
    try {
      await resetPassword.mutateAsync({
        email,
        otp,
        new_password: password,
        confirm_password: confirmPassword,
      });
      sessionStorage.removeItem("reset_password_email");
      sessionStorage.removeItem("reset_password_otp");
    } catch {
      /* toast shown in hook */
    }
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

        <Button
          type="submit"
          className="h-12 w-full"
          isLoading={resetPassword.isPending}
          loadingText="Đang xử lý..."
        >
          Đặt lại mật khẩu
        </Button>
      </form>
    </AuthCard>
  );
}
