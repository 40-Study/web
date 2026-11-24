import type { Metadata } from "next";
import { buildPageMetadata, plainTextExcerpt } from "@/lib/page-metadata";
import { getContestBySlugServer } from "@/lib/server-fetchers/contest";

/**
 * Metadata theo cuộc thi (G-09, QA3 261104; N-03, QA4 261123). `page.tsx` là client component nên metadata nằm ở
 * layout passthrough này, qua `buildPageMetadata` để og:title/mô tả/ảnh là của cuộc thi chứ không phải của trang
 * danh sách. Có route con (play/result/certificate) nên giữ template tiêu đề. Không lấy được cuộc thi (ẩn với
 * khách, backend lỗi) thì giữ metadata "Cuộc thi" của `contests/layout.tsx`. Slug không tồn tại trả 404 thật ở
 * middleware (`lib/missing-resource-probe.ts`), không phải ở đây: fetch này không mang cookie nên không phân
 * biệt được "không có" với "chỉ người đăng nhập mới thấy".
 */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const contest = await getContestBySlugServer(params.slug);
  if (!contest) return {};
  return buildPageMetadata({
    title: contest.title,
    description:
      plainTextExcerpt(contest.description ?? "") || `Cuộc thi ${contest.title} trên ForteX: thi đấu, xếp hạng và nhận chứng nhận.`,
    path: `/contests/${encodeURIComponent(params.slug)}`,
    type: "article",
    images: contest.banner_url ? [{ url: contest.banner_url, alt: contest.title }] : undefined,
    hasChildRoutes: true,
  });
}

export default function ContestDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
