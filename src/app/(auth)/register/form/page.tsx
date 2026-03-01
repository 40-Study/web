"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTH_ROUTES } from "@/lib/routes";

export default function RegisterFormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(AUTH_ROUTES.REGISTER_ROLE);
  };

  return (
    <AuthCard>
      <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
        Đăng ký tài khoản
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500">Điền thông tin của bạn</p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="Tạo mật khẩu"
          value={formData.password}
          onChange={handleChange("password")}
          className="h-12"
          required
        />

        <Button type="submit" className="h-12 w-full">
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
