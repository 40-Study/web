import type { Metadata } from "next";

/**
 * Metadata cho Trung tâm trợ giúp (G1) — trang công khai với FAQ tĩnh; `page.tsx`
 * là client component nên metadata nằm ở layout passthrough.
 */
export const metadata: Metadata = {
  title: "Trợ giúp",
  description:
    "Câu hỏi thường gặp về tài khoản, khóa học, thanh toán và chứng chỉ trên ForteX, kèm kênh liên hệ hỗ trợ.",
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
