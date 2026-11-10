import { Metadata } from "next";
import { sectionTitle } from "@/lib/page-metadata";

/**
 * Layout của nhánh (app)/courses — hiện chỉ bọc trang bài tập `/courses/[slug]/exercises`
 * (danh sách khoá học nằm ở `(main)/courses`). Title dạng object để trang con giữ " | ForteX" (QA-A-08).
 */
export const metadata: Metadata = {
  title: sectionTitle("Khám phá khoá học"),
  // Không hứa "hàng trăm khoá học" khi chưa có số liệu thật (cùng tinh thần QA-A-05).
  description: "Khám phá các khoá học trên ForteX, học mọi lúc, mọi nơi.",
  openGraph: {
    title: "Khám phá khoá học | ForteX",
    description: "Khám phá các khoá học trên ForteX, học mọi lúc, mọi nơi.",
  },
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
