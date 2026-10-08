import type { Metadata } from "next";

/**
 * Metadata cho trang xác thực OTP (G1) — page là client component.
 * `robots: noindex` vì đây là bước trong luồng đăng ký, không có giá trị tìm kiếm.
 */
export const metadata: Metadata = {
  title: "Xác thực OTP",
  robots: { index: false, follow: false },
};

export default function OtpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
