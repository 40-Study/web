"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { OtpInput } from "@/components/auth/otp-input";
import { MailIcon } from "@/components/icons";
import { AUTH_ROUTES } from "@/lib/routes";
import { STORAGE_KEYS } from "@/lib/constants";
import {
  useRegister,
  useRegisterRequest,
  authErrorMessage,
  translateOtpErrorMessage,
} from "@/hooks/queries/use-auth";

export default function OtpPage() {
  const router = useRouter();
  const register = useRegister();
  const registerRequest = useRegisterRequest();
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // Đổi key để remount OtpInput -> xoá sạch 6 ô nhập sau khi OTP sai, thay vì
  // để người dùng đứng nhìn 6 số cũ không biết vừa thất bại (QA khách P1, 260927).
  const [otpResetKey, setOtpResetKey] = useState(0);

  const handleComplete = async (otpCode: string) => {
    setOtp(otpCode);
    setErrorMessage("");

    // Get email from sessionStorage (set during register request)
    const email = sessionStorage.getItem(STORAGE_KEYS.REGISTER_EMAIL);
    if (!email) {
      router.push(AUTH_ROUTES.REGISTER);
      return;
    }

    try {
      await register.mutateAsync({ email, otp: otpCode });
      sessionStorage.removeItem(STORAGE_KEYS.REGISTER_EMAIL);
      sessionStorage.removeItem(STORAGE_KEYS.REGISTER_PAYLOAD);
      router.push(AUTH_ROUTES.REGISTER_SUCCESS); // Navigate manually since hook no longer does it
    } catch (error) {
      // Trước đây chỉ log console — người dùng không biết thao tác vừa thất
      // bại, 6 ô vẫn giữ số cũ, đồng hồ đếm ngược vẫn chạy như chưa có gì xảy
      // ra (QA khách P1, 260927). Backend trả 400 kèm message cho OTP sai/hết
      // hạn — dùng luôn message đó nếu có (authErrorMessage tự tách riêng
      // trường hợp 429 rate-limit, xem use-auth.ts).
      setErrorMessage(
        translateOtpErrorMessage(
          authErrorMessage(error, "Mã OTP không đúng hoặc đã hết hạn, vui lòng thử lại")
        )
      );
      setOtpResetKey((k) => k + 1);
    }
  };

  const handleResend = async () => {
    const email = sessionStorage.getItem(STORAGE_KEYS.REGISTER_EMAIL);
    const payloadRaw = sessionStorage.getItem(STORAGE_KEYS.REGISTER_PAYLOAD);
    if (!email || !payloadRaw) {
      router.push(AUTH_ROUTES.REGISTER);
      return;
    }
    try {
      const payload = JSON.parse(payloadRaw) as {
        password: string;
        confirm_password: string;
        user_name: string;
        full_name?: string;
      };
      // Backend không có endpoint resend riêng — gọi lại register/request với
      // cùng payload đã lưu để gửi mã OTP mới (khác bucket rate-limit với
      // /login, xem otpRateLimiter trong auth_router.go).
      await registerRequest.mutateAsync({ email, ...payload });
      setErrorMessage("");
    } catch {
      toast.error("Không thể gửi lại mã, vui lòng thử lại sau");
    }
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
        <OtpInput
          key={otpResetKey}
          onComplete={handleComplete}
          onResend={handleResend}
          countdown={90}
        />
        {errorMessage && (
          <p className="mt-4 text-sm font-medium text-red-500" role="alert">
            {errorMessage}
          </p>
        )}
        {register.isPending && (
          <p className="mt-4 text-sm text-muted-foreground">Đang xử lý...</p>
        )}
      </div>
    </AuthCard>
  );
}
