"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { OtpInput } from "@/components/auth/otp-input";
import { MailIcon } from "@/components/icons";
import { AUTH_ROUTES } from "@/lib/routes";
import { useResetPasswordRequest } from "@/hooks/queries/use-auth";

export default function ForgotPasswordOtpPage() {
  const router = useRouter();
  const resetPasswordRequest = useResetPasswordRequest();
  const [, setOtp] = useState("");

  const handleComplete = (otpCode: string) => {
    setOtp(otpCode);

    const email = sessionStorage.getItem("reset_password_email");
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
    const email = sessionStorage.getItem("reset_password_email");
    if (!email) {
      router.push(AUTH_ROUTES.FORGOT_PASSWORD);
      return;
    }
    // useResetPasswordRequest tự toast "Mã xác nhận đã được gửi" khi thành công.
    resetPasswordRequest.mutate({ email });
  };

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
