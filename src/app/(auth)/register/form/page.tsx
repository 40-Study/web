"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTH_ROUTES } from "@/lib/routes";
import { AUTH_CONFIG, STORAGE_KEYS } from "@/lib/constants";
import { useRegisterRequest } from "@/hooks/queries/use-auth";

interface FormData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type FieldErrors = Partial<Record<keyof FormData, string>>;

export default function RegisterFormPage() {
  const router = useRouter();
  const registerRequest = useRegisterRequest();
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError("");
  };

  // Regex email đơn giản, đủ để chặn lỗi gõ nhầm phổ biến — validate thật sự
  // (email đã tồn tại?) vẫn do backend quyết định khi gọi registerRequest.
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!formData.username.trim()) errors.username = "Vui lòng nhập tên đăng nhập";
    if (!formData.lastName.trim()) errors.lastName = "Vui lòng nhập họ";
    if (!formData.firstName.trim()) errors.firstName = "Vui lòng nhập tên";
    if (!formData.email.trim()) {
      errors.email = "Vui lòng nhập email";
    } else if (!EMAIL_PATTERN.test(formData.email.trim())) {
      // Trước đây chỉ check rỗng — trình duyệt tự hiện tooltip validate mặc
      // định tiếng Anh cho input type="email", lệch với phần còn lại của UI
      // (QA khách P3, 260927).
      errors.email = "Email không đúng định dạng (vd: ten@vidu.com)";
    }
    if (formData.password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
      errors.password = `Mật khẩu phải có ít nhất ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} ký tự`;
    }
    if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = "Mật khẩu không khớp";
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validate();
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
      setFormError("Đăng ký thất bại. Vui lòng thử lại.");
    }
  };

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
