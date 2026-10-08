import type { Metadata } from "next";

/** Metadata cho trang Đăng ký (G1) — page là client component, cần layout passthrough. */
export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Tạo tài khoản ForteX miễn phí để bắt đầu học tập và trải nghiệm nền tảng.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
