"use client";

/**
 * Discussion post detail page — full post content with nested comment thread
 */

import Link from "next/link";
import { ArrowLeft, Heart, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useDiscussionPost,
  useAddDiscussionComment,
  useVoteDiscussion,
  useRemoveVoteDiscussion,
} from "@/hooks/queries/use-discussions";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { DiscussionComment } from "./discussion-comment";
import { useState } from "react";

interface PageProps {
  params: { slug: string };
}

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-slate-100 text-slate-600",
  question: "bg-blue-100 text-blue-600",
  tips: "bg-green-100 text-green-600",
  showcase: "bg-purple-100 text-purple-600",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  return days < 30 ? `${days} ngày trước` : new Date(dateStr).toLocaleDateString("vi-VN");
}

export default function DiscussionDetailPage({ params }: PageProps) {
  const { slug } = params;
  const { data: post, isLoading } = useDiscussionPost(slug);
  const addComment = useAddDiscussionComment(slug);
  const votePost = useVoteDiscussion();
  const removeVote = useRemoveVoteDiscussion();

  const [commentContent, setCommentContent] = useState("");

  const hasVoted = post?.user_vote === "upvote";
  const categoryColor = CATEGORY_COLORS[post?.category ?? ""] ?? "bg-slate-100 text-slate-600";
  const initials = post?.author_name?.slice(0, 2).toUpperCase() ?? "??";

  const handlePostVote = () => {
    if (!post) return;
    if (hasVoted) {
      removeVote.mutate({ id: post.id });
    } else {
      votePost.mutate({ id: post.id, voteType: "upvote" });
    }
  };

  const handleCommentVote = (id: string, voted: boolean) => {
    if (voted) {
      removeVote.mutate({ id });
    } else {
      votePost.mutate({ id, voteType: "upvote" });
    }
  };

  const handleCommentSubmit = () => {
    if (!commentContent.trim()) return;
    addComment.mutate({ content: commentContent });
    setCommentContent("");
  };

  const handleReply = (parentId: string, content: string) => {
    addComment.mutate({ content, parent_id: parentId });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="h-8 w-2/3 bg-slate-200 rounded" />
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-4/5 bg-slate-100 rounded" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">Bài viết không tồn tại.</p>
        <Link href="/discussions" className="text-primary-500 hover:underline text-sm mt-2 inline-block">
          Quay lại diễn đàn
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/discussions"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-500 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Diễn đàn
      </Link>

      {/* Post card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        {/* Category + meta */}
        <div className="flex items-center gap-3 mb-4">
          <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", categoryColor)}>
            {post.category}
          </span>
          <span className="text-xs text-slate-400">{timeAgo(post.created_at)}</span>
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-4">{post.title}</h1>

        {/* Author */}
        <div className="flex items-center gap-3 mb-5">
          {post.avatar_url ? (
            <img src={post.avatar_url} alt={post.author_name} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
              {initials}
            </div>
          )}
          <span className="text-sm font-medium text-slate-700">{post.author_name}</span>
        </div>

        {/* Content */}
        <div
          className="prose prose-sm max-w-none text-slate-700 mb-6"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
          <button
            onClick={handlePostVote}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              hasVoted ? "text-rose-500" : "text-slate-400 hover:text-rose-400"
            )}
          >
            <Heart className={cn("w-4 h-4", hasVoted && "fill-rose-500")} />
            <span>{post.upvote_count}</span>
          </button>
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <MessageSquare className="w-4 h-4" />
            <span>{post.reply_count} bình luận</span>
          </div>
        </div>
      </div>

      {/* Comment composer */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">Viết bình luận</p>
        <TiptapEditor
          value={commentContent}
          onChange={setCommentContent}
          placeholder="Chia sẻ suy nghĩ của bạn..."
          minHeight={100}
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleCommentSubmit}
            disabled={!commentContent.trim() || addComment.isPending}
            className="text-sm font-medium px-4 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {addComment.isPending ? "Đang gửi..." : "Gửi bình luận"}
          </button>
        </div>
      </div>

      {/* Comments thread */}
      {post.comments?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 divide-y divide-slate-50">
          {post.comments.map((comment) => (
            <DiscussionComment
              key={comment.id}
              comment={comment}
              onVote={handleCommentVote}
              onReply={handleReply}
              isReplying={addComment.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
