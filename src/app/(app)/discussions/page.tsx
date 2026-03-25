import Link from "next/link";
import { MessageSquare, ThumbsUp, Clock3 } from "lucide-react";
import { discussionPosts } from "./discussion-data";

export default function DiscussionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Thảo luận cộng đồng</h1>
        <p className="text-muted-foreground">
          Không gian trao đổi kiến thức, kinh nghiệm học và góp ý dự án.
        </p>
      </div>

      <div className="grid gap-4">
        {discussionPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/discussions/${post.slug}`}
            className="block rounded-xl border bg-white p-5 transition-colors hover:bg-slate-50"
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                {post.category}
              </span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  {post.createdAt}
                </span>
              </div>
            </div>

            <h2 className="mb-2 text-xl font-semibold text-slate-900">{post.title}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{post.summary}</p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Tác giả: {post.author}</span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {post.replies}
              </span>
              <span className="inline-flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                {post.likes}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
