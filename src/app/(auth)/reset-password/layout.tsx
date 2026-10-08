import type { Metadata } from "next";

/**
 * Metadata cho trang Đặt lại mật khẩu (G1) — page là client component.
 * `robots: noindex` vì đây là bước trong luồng khôi phục tài khoản, không có
 * giá trị tìm kiếm và không nên xuất hiện trên kết quả tìm kiếm.
 */
export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
