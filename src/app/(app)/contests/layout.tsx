import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";

/**
 * Metadata cho khu vực Cuộc thi (G1) — danh sách công khai, `page.tsx` là client
 * component nên title/description đặt ở layout passthrough. Các trang con làm
 * bài/kết quả/chứng nhận đã bị middleware chặn đăng nhập, không cần metadata.
 * `hasChildRoutes` (sectionTitle): trang chi tiết `[slug]` tự đặt tên cuộc thi, cần giữ hậu tố " | ForteX" (QA-A-08).
 * Q5-PG-10: trước đây thiếu `openGraph` nên og:title/og:description rơi về mặc định toàn site
 * ("ForteX — Learn Leap Lead"); khoá học, thảo luận, trợ giúp đã đặt đủ cả hai.
 */
export const metadata: Metadata = buildPageMetadata({
  title: "Cuộc thi",
  description: "Tham gia các cuộc thi học thuật trên ForteX — thi đấu, xếp hạng và nhận chứng chỉ.",
  path: "/contests",
  hasChildRoutes: true,
});

export default function ContestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
