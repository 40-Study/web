"use client";

/**
 * Single discussion post card — shows author, title, excerpt, category tag, vote/reply counts
 */

import Link from "next/link";
import { toast } from "sonner";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import type { ForumPost } from "@/types/discussion";
import { discussionCategoryLabel } from "./discussion-categories";

interface DiscussionPostCardProps {
  post: ForumPost;
  onVote: (id: string, hasVoted: boolean) => void;
  delay?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  programming: "bg-slate-100 text-slate-600",
  design: "bg-blue-100 text-blue-600",
  "learning-tips": "bg-green-100 text-green-600",
  project: "bg-purple-100 text-purple-600",
  qna: "bg-amber-100 text-amber-700",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").slice(0, 160);
}

export function DiscussionPostCard({ post, onVote, delay = 0 }: DiscussionPostCardProps) {
  const hasVoted = post.user_vote === "upvote";
  const categoryColor = CATEGORY_COLORS[post.category] ?? "bg-slate-100 text-slate-600";
  const initials = post.author_name?.slice(0, 2).toUpperCase() ?? "??";

  // Q6-PG-12: sao chép phải báo kết quả; trình duyệt từ chối quyền clipboard (hoặc không có) từng ném lỗi chưa bắt.
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + `/discussions/${post.slug}`);
      toast.success("Đã sao chép liên kết");
    } catch {
      toast.error("Không sao chép được liên kết");
    }
  };

  return (
    <ScrollReveal delay={delay}>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        {/* Author row */}
        <div className="flex items-center gap-3 mb-3">
          {post.avatar_url ? (
            <img src={post.avatar_url} alt={post.author_name} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-800">{post.author_name}</p>
            <p className="text-xs text-slate-400">{timeAgo(post.created_at)}</p>
          </div>
          <span className={cn("ml-auto text-xs font-medium px-2.5 py-1 rounded-full", categoryColor)}>
            {discussionCategoryLabel(post.category)}
          </span>
        </div>

        {/* Title + excerpt */}
        <Link href={`/discussions/${post.slug}`} className="block group">
          <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors mb-1 line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2">{stripHtml(post.content)}</p>
        </Link>

        {/* Actions */}
        {/* S7-08: mỗi nút >= 32px (WCAG 2.2 AA tối thiểu 24px), 44px dưới 640px. */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
          <button
            type="button"
            onClick={() => onVote(post.id, hasVoted)}
            aria-label={`${hasVoted ? "Bỏ thích" : "Thích"} bài viết (${post.upvote_count})`}
            aria-pressed={hasVoted}
            className={cn(
              "inline-flex min-h-8 min-w-8 items-center justify-center gap-1.5 text-sm max-sm:min-h-11 transition-colors",
              hasVoted ? "text-rose-500" : "text-slate-400 hover:text-rose-400"
            )}
          >
            <Heart className={cn("w-4 h-4", hasVoted && "fill-rose-500")} aria-hidden="true" />
            <span>{post.upvote_count}</span>
          </button>

          <Link
            href={`/discussions/${post.slug}`}
            aria-label={`Xem ${post.reply_count} phản hồi`}
            className="inline-flex min-h-8 min-w-8 items-center justify-center gap-1.5 text-sm max-sm:min-h-11 text-slate-400 hover:text-primary-500 transition-colors"
          >
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            <span>{post.reply_count}</span>
          </Link>

          <button
            type="button"
            onClick={() => void handleShare()}
            className="inline-flex min-h-8 min-w-8 items-center justify-center gap-1.5 text-sm max-sm:min-h-11 text-slate-400 hover:text-slate-600 transition-colors ml-auto"
          >
            <Share2 className="w-4 h-4" />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>
    </ScrollReveal>
  );
}
