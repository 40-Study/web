"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTH_ROUTES } from "@/lib/routes";
import { useRegisterRequest } from "@/hooks/queries/use-auth";

export default function RegisterFormPage() {
  const router = useRouter();
  const registerRequest = useRegisterRequest();
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    if (formData.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    try {
      await registerRequest.mutateAsync({
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        user_name: formData.username,
        full_name: `${formData.lastName} ${formData.firstName}`.trim(),
      });
      // Store email in sessionStorage for the OTP page
      sessionStorage.setItem("register_email", formData.email);
      router.push(AUTH_ROUTES.OTP);
    } catch (err) {
      console.error("Failed to request OTP:", err);
      setError("Đăng ký thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <AuthCard>
      <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
        Đăng ký tài khoản
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500">Điền thông tin của bạn</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên đăng nhập"
          placeholder="username"
          value={formData.username}
          onChange={handleChange("username")}
          className="h-12"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Họ"
            placeholder="Nguyễn"
            value={formData.lastName}
            onChange={handleChange("lastName")}
            className="h-12"
            required
          />
          <Input
            label="Tên"
            placeholder="Văn A"
            value={formData.firstName}
            onChange={handleChange("firstName")}
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
          className="h-12"
          required
        />
        <Input
          type="password"
          label="Mật khẩu"
          placeholder="Tạo mật khẩu (ít nhất 8 ký tự)"
          value={formData.password}
          onChange={handleChange("password")}
          className="h-12"
          required
        />
        <Input
          type="password"
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          value={formData.confirmPassword}
          onChange={handleChange("confirmPassword")}
          className="h-12"
          required
        />

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <Button 
          type="submit" 
          className="h-12 w-full"
          disabled={registerRequest.isPending}
        >
          {registerRequest.isPending ? "Đang gửi mã..." : "Tiếp tục"}
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
