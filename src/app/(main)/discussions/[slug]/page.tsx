import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageSquare, ThumbsUp } from "lucide-react";
import { getDiscussionBySlug } from "../discussion-data";

interface DiscussionDetailPageProps {
  params: {
    slug: string;
  };
}

export default function DiscussionDetailPage({ params }: DiscussionDetailPageProps) {
  const post = getDiscussionBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/discussions"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại danh sách thảo luận
      </Link>

      <article className="rounded-2xl border bg-white p-6 md:p-8">
        <header className="mb-6 border-b pb-6">
          <div className="mb-3 inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            {post.category}
          </div>
          <h1 className="mb-3 text-3xl font-bold text-slate-900">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>Tác giả: {post.author}</span>
            <span>{post.createdAt}</span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {post.replies} phản hồi
            </span>
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              {post.likes} lượt thích
            </span>
          </div>
        </header>

        <div className="space-y-4 text-slate-700">
          {post.content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
