import type { Metadata } from "next";

/**
 * Metadata cho danh sách thảo luận (G1) — trang công khai, `page.tsx` là client
 * component nên cần layout passthrough này để xuất `metadata`.
 */
export const metadata: Metadata = {
  title: "Thảo luận",
  description:
    "Cộng đồng học tập ForteX — đặt câu hỏi, chia sẻ kinh nghiệm và trao đổi cùng giảng viên, học viên.",
};

export default function DiscussionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
