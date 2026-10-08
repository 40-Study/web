import type { Metadata } from "next";

/**
 * Metadata cho khu vực Cuộc thi (G1) — danh sách công khai, `page.tsx` là client
 * component nên title/description đặt ở layout passthrough. Các trang con làm
 * bài/kết quả/chứng nhận đã bị middleware chặn đăng nhập, không cần metadata.
 */
export const metadata: Metadata = {
  title: "Cuộc thi",
  description:
    "Tham gia các cuộc thi học thuật trên ForteX — thi đấu, xếp hạng và nhận chứng chỉ.",
};

export default function ContestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
