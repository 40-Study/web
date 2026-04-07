"use client";

/**
 * Recursive comment component — renders a comment and its nested replies
 */

import { useState } from "react";
import { Heart, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import type { ForumComment } from "@/types/discussion";

interface DiscussionCommentProps {
  comment: ForumComment;
  depth?: number;
  onVote: (id: string, hasVoted: boolean) => void;
  onReply: (parentId: string, content: string) => void;
  isReplying?: boolean;
}

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

export function DiscussionComment({
  comment,
  depth = 0,
  onVote,
  onReply,
  isReplying = false,
}: DiscussionCommentProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const hasVoted = comment.user_vote === "upvote";
  const initials = comment.author_name?.slice(0, 2).toUpperCase() ?? "??";

  const handleReplySubmit = () => {
    if (!replyContent.trim()) return;
    onReply(comment.id, replyContent);
    setReplyContent("");
    setShowReplyBox(false);
  };

  return (
    <div className={cn("group", depth > 0 && "ml-8 border-l-2 border-slate-100 pl-4")}>
      <div className="flex gap-3 py-3">
        {/* Avatar */}
        {comment.avatar_url ? (
          <img src={comment.avatar_url} alt={comment.author_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs shrink-0">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Author + time */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-800">{comment.author_name}</span>
            <span className="text-xs text-slate-400">{timeAgo(comment.created_at)}</span>
          </div>

          {/* Content */}
          <div
            className="prose prose-sm max-w-none text-slate-700 [&_p]:mb-1"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => onVote(comment.id, hasVoted)}
              className={cn(
                "flex items-center gap-1 text-xs transition-colors",
                hasVoted ? "text-rose-500" : "text-slate-400 hover:text-rose-400"
              )}
            >
              <Heart className={cn("w-3.5 h-3.5", hasVoted && "fill-rose-500")} />
              <span>{comment.upvote_count}</span>
            </button>

            {depth < 2 && (
              <button
                onClick={() => setShowReplyBox(!showReplyBox)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-500 transition-colors"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                Trả lời
              </button>
            )}
          </div>

          {/* Inline reply box */}
          {showReplyBox && (
            <div className="mt-3 space-y-2">
              <TiptapEditor
                value={replyContent}
                onChange={setReplyContent}
                placeholder="Viết phản hồi..."
                minHeight={80}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowReplyBox(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim() || isReplying}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {isReplying ? "Đang gửi..." : "Gửi"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies?.map((reply) => (
        <DiscussionComment
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          onVote={onVote}
          onReply={onReply}
          isReplying={isReplying}
        />
      ))}
    </div>
  );
}
