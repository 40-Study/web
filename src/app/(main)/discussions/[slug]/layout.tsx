import type { Metadata } from "next";
import { getDiscussionBySlugServer } from "@/lib/server-fetchers/discussion";
import { buildPageMetadata, plainTextExcerpt } from "@/lib/page-metadata";

/**
 * Metadata cho bài thảo luận — trang công khai, `page.tsx` là client component nên metadata nằm ở layout
 * passthrough này. Lấy tiêu đề/nội dung thật để link chia sẻ ra Facebook/Zalo hiện đúng bài (PG-M1).
 */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const path = `/discussions/${encodeURIComponent(params.slug)}`;
  const post = await getDiscussionBySlugServer(params.slug);

  if (!post) {
    return buildPageMetadata({
      title: "Thảo luận",
      description: "Cộng đồng học tập ForteX — đặt câu hỏi, chia sẻ kinh nghiệm và trao đổi cùng giảng viên, học viên.",
      path,
    });
  }

  return buildPageMetadata({
    title: post.title,
    description: plainTextExcerpt(post.content ?? "") || `Bài thảo luận "${post.title}" trên ForteX.`,
    path,
    type: "article",
  });
}

export default function DiscussionDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
