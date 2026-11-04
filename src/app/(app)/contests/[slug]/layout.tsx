import type { Metadata } from "next";
import { getContestBySlugServer } from "@/lib/server-fetchers/contest";

/**
 * Tiêu đề tab theo tên cuộc thi (G-09, QA3 261104). `page.tsx` là client component nên metadata nằm ở layout
 * passthrough này. Không lấy được tên (cuộc thi ẩn với khách, backend lỗi) thì giữ tiêu đề "Cuộc thi" của
 * `contests/layout.tsx`.
 */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const contest = await getContestBySlugServer(params.slug);
  return contest ? { title: contest.title } : {};
}

export default function ContestDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
