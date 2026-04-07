"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { OtpInput } from "@/components/auth/otp-input";
import { MailIcon } from "@/components/icons";
import { AUTH_ROUTES } from "@/lib/routes";

export default function ForgotPasswordOtpPage() {
  const router = useRouter();
  const [, setOtp] = useState("");

  const handleComplete = (otpCode: string) => {
    setOtp(otpCode);

    const email = sessionStorage.getItem("reset_password_email");
    if (!email) {
      router.push(AUTH_ROUTES.FORGOT_PASSWORD);
      return;
    }

    // Store OTP for the reset-password page
    sessionStorage.setItem("reset_password_otp", otpCode);
    router.push(AUTH_ROUTES.RESET_PASSWORD);
  };

  return (
    <AuthCard>
      <div className="flex flex-col items-center py-4">
        <AuthIconHeader
          icon={<MailIcon size={32} className="text-primary-500" />}
          title="Xác thực OTP"
          description="Nhập mã 6 chữ số đã được gửi đến email của bạn"
          className="mb-8"
        />
        <OtpInput onComplete={handleComplete} countdown={90} />
      </div>
    </AuthCard>
  );
}
