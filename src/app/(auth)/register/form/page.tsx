"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTH_ROUTES } from "@/lib/routes";
import { STORAGE_KEYS } from "@/lib/constants";
import { authErrorMessage, useRegisterRequest } from "@/hooks/queries/use-auth";
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated";
import { validateRegisterForm, type RegisterFieldErrors, type RegisterFormData as FormData } from "@/lib/register-validation";

export default function RegisterFormPage() {
  const router = useRouter();
  const registerRequest = useRegisterRequest();
  // A-01: đã đăng nhập thì về trang chủ vai trò thay vì hiện form đăng ký.
  const redirecting = useRedirectIfAuthenticated();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  // Lỗi theo TỪNG field thay vì gộp thành 1 chuỗi chung (mục 14) — form
  // không dùng react-hook-form/zod nên validate bằng object errors thủ công.
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [formError, setFormError] = useState("");

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateRegisterForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const payload = {
        password: formData.password,
        confirm_password: formData.confirmPassword,
        user_name: formData.username,
        full_name: `${formData.lastName} ${formData.firstName}`.trim() || undefined,
      };
      await registerRequest.mutateAsync({ email: formData.email, ...payload });
      sessionStorage.setItem(STORAGE_KEYS.REGISTER_EMAIL, formData.email);
      // Lưu payload (không kèm OTP) để trang /otp gọi lại được khi "Gửi lại mã".
      sessionStorage.setItem(STORAGE_KEYS.REGISTER_PAYLOAD, JSON.stringify(payload));
      router.push(AUTH_ROUTES.OTP);
    } catch (err) {
      console.error("Failed to request OTP:", err);
      // Hiện lý do thật (email đã đăng ký, tên đăng nhập trùng, rate-limit...) thay vì một câu chung.
      setFormError(authErrorMessage(err, "Đăng ký thất bại. Vui lòng thử lại."));
    }
  };

  if (redirecting) return null;

  return (
    <AuthCard>
      <h2 className="mb-1 text-center text-xl font-semibold text-foreground">
        Đăng ký tài khoản
      </h2>
      <p className="mb-6 text-center text-sm text-muted-foreground">Điền thông tin của bạn</p>

      {/* noValidate: để validate() tự chạy và hiện lỗi tiếng Việt thay vì
          tooltip validate mặc định tiếng Anh của trình duyệt cho input
          type="email"/required (QA khách P3, 260927). */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Tên đăng nhập"
          placeholder="username"
          value={formData.username}
          onChange={handleChange("username")}
          error={fieldErrors.username}
          className="h-12"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Họ"
            placeholder="Nguyễn"
            value={formData.lastName}
            onChange={handleChange("lastName")}
            error={fieldErrors.lastName}
            className="h-12"
            required
          />
          <Input
            label="Tên"
            placeholder="Văn A"
            value={formData.firstName}
            onChange={handleChange("firstName")}
            error={fieldErrors.firstName}
            className="h-12"
            required
          />
        </div>
        <Input
          type="email"
          label="Email"
          placeholder="example@email.com"
          value={formData.email}
          onChange={handleChange("email")}
          error={fieldErrors.email}
          className="h-12"
          required
        />
        <Input
          type="password"
          label="Mật khẩu"
          placeholder="Tạo mật khẩu (ít nhất 8 ký tự)"
          value={formData.password}
          onChange={handleChange("password")}
          error={fieldErrors.password}
          className="h-12"
          required
        />
        <Input
          type="password"
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          value={formData.confirmPassword}
          onChange={handleChange("confirmPassword")}
          error={fieldErrors.confirmPassword}
          className="h-12"
          required
        />

        {formError && <p className="text-sm text-red-500">{formError}</p>}

        <Button
          type="submit"
          className="h-12 w-full"
          isLoading={registerRequest.isPending}
          loadingText="Đang gửi mã..."
        >
          Tiếp tục
        </Button>
      </form>

      <AuthFooterLink
        text="Bạn đã có tài khoản?"
        linkText="Đăng nhập"
        href={AUTH_ROUTES.LOGIN}
        className="mt-6"
      />
    </AuthCard>
  );
}
