"use client";

import { useEffect, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LockIcon } from "@/components/icons";
import { AUTH_ROUTES } from "@/lib/routes";
import { normalizeEmail, validateEmail } from "@/lib/email-validation";
import { STORAGE_KEYS } from "@/lib/constants";
import { useResetPasswordRequest } from "@/hooks/queries/use-auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  // Mã OTP đã chết (hết hạn / hết lượt) bị trả về đây từ bước đặt mật khẩu: điền sẵn email, nói rõ lý do, người
  // dùng chỉ việc bấm gửi mã mới (Q5-PG-05 review M1). Đọc một lần; sessionStorage chỉ có ở client.
  const [goneNotice, setGoneNotice] = useState("");
  useEffect(() => {
    const notice = sessionStorage.getItem(STORAGE_KEYS.RESET_PASSWORD_GONE_NOTICE);
    const prefill = sessionStorage.getItem(STORAGE_KEYS.RESET_PASSWORD_PREFILL_EMAIL);
    sessionStorage.removeItem(STORAGE_KEYS.RESET_PASSWORD_GONE_NOTICE);
    sessionStorage.removeItem(STORAGE_KEYS.RESET_PASSWORD_PREFILL_EMAIL);
    if (notice) setGoneNotice(notice);
    if (prefill) setEmail(prefill);
  }, []);
  const resetPasswordRequest = useResetPasswordRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // noValidate trên <form>: lỗi hiện bằng tiếng Việt thay vì tooltip tiếng Anh của trình duyệt (PG-M3, QA2 261013).
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    // Q8-PG-01: chữ thường + cắt khoảng trắng, trang nhập mã dùng đúng bản này.
    const trimmed = normalizeEmail(email);
    sessionStorage.setItem(STORAGE_KEYS.RESET_PASSWORD_EMAIL, trimmed);
    try {
      await resetPasswordRequest.mutateAsync({ email: trimmed });
    } catch {
      // Q5-PG-07: toast lỗi (429 kèm số giây chờ...) do mặc định của mutation hiện; nuốt ở đây để lỗi không
      // thành "uncaught (in promise)" ở console.
    }
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

      {goneNotice && (
        <p className="mb-4 text-center text-sm font-medium text-red-500" role="alert">
          {goneNotice}
        </p>
      )}

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
