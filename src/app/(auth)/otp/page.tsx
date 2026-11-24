"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { OtpInput } from "@/components/auth/otp-input";
import { MailIcon } from "@/components/icons";
import { AUTH_ROUTES } from "@/lib/routes";
import { STORAGE_KEYS } from "@/lib/constants";
import {
  useRegister,
  useRegisterResendOtp,
  authErrorMessage,
  isRegistrationExpiredError,
  REGISTRATION_EXPIRED_MESSAGE,
  translateOtpErrorMessage,
} from "@/hooks/queries/use-auth";
import { markOneShotPage } from "@/hooks/use-one-shot-page";
import { useFlowGuard } from "@/hooks/use-flow-guard";

export default function OtpPage() {
  const router = useRouter();
  // G-05: mở thẳng /otp khi chưa có yêu cầu đăng ký -> về /register ngay, không đợi tới lúc nhập đủ 6 số.
  const hasPendingRegistration = useFlowGuard(
    [STORAGE_KEYS.REGISTER_EMAIL],
    AUTH_ROUTES.REGISTER,
    "Chưa có yêu cầu đăng ký nào cần xác thực. Vui lòng đăng ký trước.",
  );
  // Dọn mật khẩu dạng rõ mà bản cũ để lại trong sessionStorage (review web#123 #4).
  useEffect(() => {
    sessionStorage.removeItem(STORAGE_KEYS.LEGACY_REGISTER_PAYLOAD);
  }, []);
  const register = useRegister();
  const resendOtp = useRegisterResendOtp();
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // Đổi key để remount OtpInput -> xoá sạch 6 ô nhập sau khi OTP sai, thay vì
  // để người dùng đứng nhìn 6 số cũ không biết vừa thất bại (QA khách P1, 260927).
  const [otpResetKey, setOtpResetKey] = useState(0);

  /**
   * Không còn đăng ký đang chờ (410): quay lại form, điền sẵn email, người dùng nhập lại phần còn lại.
   * Dùng chung cho "Gửi lại mã" và nhập mã (Q5-PG-11: nhập mã trên đăng ký hết hạn từng chỉ hiện câu chữ,
   * 6 ô trống và đồng hồ gửi lại vẫn chạy, không có đường đi tiếp).
   */
  const restartExpiredRegistration = (email: string) => {
    sessionStorage.removeItem(STORAGE_KEYS.REGISTER_EMAIL);
    sessionStorage.setItem(STORAGE_KEYS.REGISTER_PREFILL_EMAIL, email);
    toast.error(REGISTRATION_EXPIRED_MESSAGE);
    router.push(AUTH_ROUTES.REGISTER_FORM);
  };

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
      markOneShotPage(STORAGE_KEYS.REGISTER_SUCCESS_FLAG);
      router.push(AUTH_ROUTES.REGISTER_SUCCESS); // Navigate manually since hook no longer does it
    } catch (error) {
      if (isRegistrationExpiredError(error)) {
        restartExpiredRegistration(email);
        return;
      }
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

  // Trả false khi gửi không thành công để OtpInput không khởi động lại đồng hồ (Q5-PG-07).
  const handleResend = async (): Promise<boolean> => {
    const email = sessionStorage.getItem(STORAGE_KEYS.REGISTER_EMAIL);
    if (!email) {
      router.push(AUTH_ROUTES.REGISTER);
      return false;
    }
    try {
      // N-07 (QA4 261123): backend gửi lại mã từ đăng ký đang chờ phía server, chỉ cần email. Trước đây trang
      // gọi lại register/request với mật khẩu lưu dạng rõ trong sessionStorage.
      await resendOtp.mutateAsync({ email });
      setErrorMessage("");
      return true;
    } catch (error) {
      if (isRegistrationExpiredError(error)) {
        restartExpiredRegistration(email);
        return false;
      }
      // 429 (3 lần / 5 phút / email, chung bucket với register/request): RateLimitError đã mang câu kèm số giây.
      toast.error(authErrorMessage(error, "Không thể gửi lại mã, vui lòng thử lại sau"));
      return false;
    }
  };

  if (!hasPendingRegistration) return null;

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
