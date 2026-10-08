import type { Metadata } from "next";

/**
 * Metadata cho DANH SÁCH khóa học (G1).
 *
 * `page.tsx` là client component ("use client") nên không xuất được `metadata`;
 * layout passthrough này giữ nguyên cây render, chỉ bổ sung title/description.
 * Template "%s | ForteX" ở root layout sẽ nối tên site vào sau.
 */
export const metadata: Metadata = {
  title: "Khóa học",
  description:
    "Khám phá các khóa học lập trình, thiết kế và kỹ năng số trên ForteX — lọc theo danh mục, cấp độ và giảng viên.",
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
