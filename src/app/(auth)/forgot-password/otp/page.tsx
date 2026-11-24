"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { OtpInput } from "@/components/auth/otp-input";
import { MailIcon } from "@/components/icons";
import { AUTH_ROUTES } from "@/lib/routes";
import { useResetPasswordRequest } from "@/hooks/queries/use-auth";
import { useFlowGuard } from "@/hooks/use-flow-guard";
import { STORAGE_KEYS } from "@/lib/constants";

export default function ForgotPasswordOtpPage() {
  const router = useRouter();
  // N-02 (QA4 261123): mở thẳng URL khi chưa yêu cầu mã -> về /forgot-password ngay (như /otp, G-05).
  const hasResetRequest = useFlowGuard(
    [STORAGE_KEYS.RESET_PASSWORD_EMAIL],
    AUTH_ROUTES.FORGOT_PASSWORD,
    "Chưa có yêu cầu đặt lại mật khẩu nào. Vui lòng nhập email để nhận mã xác nhận.",
  );
  const resetPasswordRequest = useResetPasswordRequest();
  const [, setOtp] = useState("");

  const handleComplete = (otpCode: string) => {
    setOtp(otpCode);

    const email = sessionStorage.getItem(STORAGE_KEYS.RESET_PASSWORD_EMAIL);
    if (!email) {
      router.push(AUTH_ROUTES.FORGOT_PASSWORD);
      return;
    }

    // Trang này chỉ LƯU mã người dùng gõ — OTP thật sự được backend kiểm khi
    // gửi cùng mật khẩu mới ở reset-password/page.tsx (1 API check-otp+set-
    // password gộp lại). Lỗi "sai OTP" hiện ở bước đó (xem useResetPassword's
    // onError, QA khách P1, 260927).
    sessionStorage.setItem("reset_password_otp", otpCode);
    router.push(AUTH_ROUTES.RESET_PASSWORD);
  };

  const handleResend = () => {
    const email = sessionStorage.getItem(STORAGE_KEYS.RESET_PASSWORD_EMAIL);
    if (!email) {
      router.push(AUTH_ROUTES.FORGOT_PASSWORD);
      return;
    }
    // useResetPasswordRequest tự toast "Mã xác nhận đã được gửi" khi thành công.
    resetPasswordRequest.mutate({ email });
  };

  if (!hasResetRequest) return null;

  return (
    <AuthCard>
      <div className="flex flex-col items-center py-4">
        <AuthIconHeader
          icon={<MailIcon size={32} className="text-primary" />}
          title="Xác thực OTP"
          description="Nhập mã 6 chữ số đã được gửi đến email của bạn"
          className="mb-8"
        />
        <OtpInput onComplete={handleComplete} onResend={handleResend} countdown={90} />
      </div>
    </AuthCard>
  );
}
