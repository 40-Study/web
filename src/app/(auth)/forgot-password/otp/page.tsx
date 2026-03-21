"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { OtpInput } from "@/components/auth/otp-input";
import { MailIcon } from "@/components/icons";
import { AUTH_ROUTES } from "@/lib/routes";
import { useResetPassword } from "@/hooks/queries/use-auth";

export default function ForgotPasswordOtpPage() {
  const router = useRouter();
  const resetPassword = useResetPassword();
  const [otp, setOtp] = useState("");

  const handleComplete = async (otpCode: string) => {
    setOtp(otpCode);
    
    const email = sessionStorage.getItem("reset_password_email");
    if (!email) {
      router.push(AUTH_ROUTES.FORGOT_PASSWORD);
      return;
    }

    try {
      await resetPassword.mutateAsync({
        email,
        otp: otpCode,
        new_password: "",
      });
      sessionStorage.removeItem("reset_password_email");
      router.push(AUTH_ROUTES.RESET_PASSWORD_SUCCESS);
    } catch (error) {
      console.error("Reset password failed:", error);
    }
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
        <OtpInput 
          onComplete={handleComplete} 
          countdown={90}
        />
        {resetPassword.isPending && (
          <p className="mt-4 text-sm text-muted-foreground">Đang xử lý...</p>
        )}
      </div>
    </AuthCard>
  );
}
