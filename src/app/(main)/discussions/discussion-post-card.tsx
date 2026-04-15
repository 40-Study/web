"use client";

/**
 * Single discussion post card — shows author, title, excerpt, category tag, vote/reply counts
 */

import Link from "next/link";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import type { ForumPost } from "@/types/discussion";

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
};

const CATEGORY_LABELS: Record<string, string> = {
  programming: "Lập trình",
  design: "Thiết kế",
  "learning-tips": "Mẹo học",
  project: "Dự án",
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

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.origin + `/discussions/${post.slug}`);
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
            {CATEGORY_LABELS[post.category] ?? post.category}
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
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
          <button
            onClick={() => onVote(post.id, hasVoted)}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              hasVoted ? "text-rose-500" : "text-slate-400 hover:text-rose-400"
            )}
          >
            <Heart className={cn("w-4 h-4", hasVoted && "fill-rose-500")} />
            <span>{post.upvote_count}</span>
          </button>

          <Link
            href={`/discussions/${post.slug}`}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-primary-500 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.reply_count}</span>
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors ml-auto"
          >
            <Share2 className="w-4 h-4" />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>
    </ScrollReveal>
  );
}
