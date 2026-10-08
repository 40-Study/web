import type { Metadata } from "next";

/** Metadata cho trang Quên mật khẩu (G1) — page là client component, cần layout passthrough. */
export const metadata: Metadata = {
  title: "Quên mật khẩu",
  description: "Yêu cầu đặt lại mật khẩu ForteX qua email đăng ký của bạn.",
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
