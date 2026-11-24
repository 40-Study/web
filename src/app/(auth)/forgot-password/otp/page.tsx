"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  // Q5-PG-05: mã sai bị backend từ chối ở bước đặt mật khẩu -> hook đưa người dùng về đây kèm câu lỗi (đọc
  // một lần). Câu hiện dưới 6 ô và mất đi khi họ gõ mã mới hoặc xin mã khác.
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.RESET_PASSWORD_OTP_ERROR);
    if (!stored) return;
    sessionStorage.removeItem(STORAGE_KEYS.RESET_PASSWORD_OTP_ERROR);
    setErrorMessage(stored);
  }, []);

  const handleComplete = (otpCode: string) => {
    setErrorMessage("");

    const email = sessionStorage.getItem(STORAGE_KEYS.RESET_PASSWORD_EMAIL);
    if (!email) {
      router.push(AUTH_ROUTES.FORGOT_PASSWORD);
      return;
    }

    // Trang này chỉ LƯU mã người dùng gõ — OTP thật sự được backend kiểm khi
    // gửi cùng mật khẩu mới ở reset-password/page.tsx (1 API check-otp+set-
    // password gộp lại). Lỗi "sai OTP" hiện ở bước đó (xem useResetPassword's
    // onError, QA khách P1, 260927).
    sessionStorage.setItem(STORAGE_KEYS.RESET_PASSWORD_OTP, otpCode);
    router.push(AUTH_ROUTES.RESET_PASSWORD);
  };

  const handleResend = async () => {
    const email = sessionStorage.getItem(STORAGE_KEYS.RESET_PASSWORD_EMAIL);
    if (!email) {
      router.push(AUTH_ROUTES.FORGOT_PASSWORD);
      return false;
    }
    // useResetPasswordRequest tự toast "Mã xác nhận đã được gửi" khi thành công; lỗi (429...) do toast mặc định
    // của mutation. Reject để OtpInput biết lần gửi thất bại và KHÔNG khởi động lại đồng hồ (Q5-PG-07).
    await resetPasswordRequest.mutateAsync({ email });
    setErrorMessage("");
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
        {errorMessage && (
          <p className="mt-4 text-sm font-medium text-red-500" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </AuthCard>
  );
}
