import type { Metadata } from "next";

/**
 * Tiêu đề tab riêng cho trang cần đăng nhập (G-09, QA3 261104): trước đây mọi trang này đều hiện "ForteX" trơn.
 * `page.tsx` là client component nên metadata nằm ở layout passthrough này.
 */
export const metadata: Metadata = { title: "Giỏ hàng" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
