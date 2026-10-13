import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";

/**
 * Metadata cho danh sách thảo luận (G1) — trang công khai, `page.tsx` là client
 * component nên cần layout passthrough này để xuất `metadata`.
 */
export const metadata: Metadata = buildPageMetadata({
  title: "Thảo luận",
  description:
    "Cộng đồng học tập ForteX — đặt câu hỏi, chia sẻ kinh nghiệm và trao đổi cùng giảng viên, học viên.",
  path: "/discussions",
});

export default function DiscussionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
