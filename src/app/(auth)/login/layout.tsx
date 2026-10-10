import type { Metadata } from "next";

/**
 * Metadata cho trang Đăng nhập (G1) — `page.tsx` là client component nên title
 * phải đặt ở layout passthrough. Root layout nối " | ForteX".
 */
export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào ForteX để tiếp tục học tập và quản lý khóa học của bạn.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
