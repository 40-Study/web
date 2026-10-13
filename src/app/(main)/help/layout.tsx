import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";

/**
 * Metadata cho Trung tâm trợ giúp (G1) — trang công khai với FAQ tĩnh; `page.tsx`
 * là client component nên metadata nằm ở layout passthrough.
 */
export const metadata: Metadata = buildPageMetadata({
  title: "Trợ giúp",
  description:
    "Câu hỏi thường gặp về tài khoản, khóa học, thanh toán và chứng chỉ trên ForteX, kèm kênh liên hệ hỗ trợ.",
  path: "/help",
});

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
