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
import { useFlowGuard } from "@/hooks/use-flow-guard";
import { STORAGE_KEYS } from "@/lib/constants";

export default function ResetPasswordPage() {
  const router = useRouter();
  // G-05: mở thẳng /reset-password khi chưa qua bước quên mật khẩu + OTP -> về /forgot-password ngay.
  const hasResetSession = useFlowGuard(
    [STORAGE_KEYS.RESET_PASSWORD_EMAIL, "reset_password_otp"],
    AUTH_ROUTES.FORGOT_PASSWORD,
    "Phiên đặt lại mật khẩu chưa bắt đầu hoặc đã hết hạn. Vui lòng yêu cầu mã xác nhận.",
  );
  const resetPassword = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // noValidate trên <form>: lỗi hiện bằng tiếng Việt thay vì tooltip tiếng Anh của trình duyệt (G-05).
    if (!password) {
      setPasswordError("Vui lòng nhập mật khẩu mới");
      return;
    }
    if (!confirmPassword) {
      setError("Vui lòng nhập lại mật khẩu mới");
      return;
    }
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

  if (!hasResetSession) return null;

  return (
    <AuthCard>
      <AuthIconHeader
        icon={<UnlockIcon size={32} className="text-primary" />}
        title="Thiết lập mật khẩu mới"
        description="Tạo mật khẩu mới cho tài khoản của bạn"
        className="mb-6"
      />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          type="password"
          label="Mật khẩu mới"
          placeholder="Nhập mật khẩu mới"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError("");
          }}
          error={passwordError}
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
