"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { OtpInput } from "@/components/auth/otp-input";
import { MailIcon } from "@/components/icons";
import { AUTH_ROUTES } from "@/lib/routes";
import { useRegister } from "@/hooks/queries/use-auth";

export default function OtpPage() {
  const router = useRouter();
  const register = useRegister();
  const [otp, setOtp] = useState("");

  const handleComplete = async (otpCode: string) => {
    setOtp(otpCode);
    
    // Get email from sessionStorage (set during register request)
    const email = sessionStorage.getItem("register_email");
    if (!email) {
      router.push(AUTH_ROUTES.REGISTER);
      return;
    }

    try {
      await register.mutateAsync({ email, otp: otpCode });
      sessionStorage.removeItem("register_email");
      router.push(AUTH_ROUTES.REGISTER_SUCCESS);
    } catch (error) {
      console.error("Registration failed:", error);
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
        {register.isPending && (
          <p className="mt-4 text-sm text-muted-foreground">Đang xử lý...</p>
        )}
      </div>
    </AuthCard>
  );
}
