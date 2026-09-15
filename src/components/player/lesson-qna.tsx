"use client";

/**
 * Hỏi đáp theo bài học (contract §5).
 *
 * Dùng lại API discussion sẵn có, chỉ gắn thêm `lesson_id`: đọc qua
 * `GET /lessons/:lessonId/discussions`, hỏi qua `POST /discussions` kèm
 * `lesson_id`. Không thêm kênh realtime mới — comment vẫn qua `/discussions/:slug/comments`.
 *
 * Backend chưa có `GET /lessons/:lessonId/discussions` thì danh sách rỗng và
 * panel hiện empty state, không có lỗi đỏ.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircleQuestion, Send, ThumbsUp } from "lucide-react";
import { discussionService } from "@/services/discussion.service";
import type { ForumPost } from "@/types/discussion";

export const LESSON_QNA_EMPTY_MESSAGE = "Chưa có câu hỏi nào cho bài này. Hỏi ngay đi!";

/** Query key riêng — không trộn với danh sách discussion của diễn đàn. */
export const lessonQnaKeys = {
  all: ["lesson-qna"] as const,
  byLesson: (lessonId: string) => [...lessonQnaKeys.all, lessonId] as const,
};

interface LessonQnAProps {
  lessonId: string;
  lessonTitle?: string;
}

export function LessonQnA({ lessonId, lessonTitle }: LessonQnAProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: lessonQnaKeys.byLesson(lessonId),
    queryFn: () => discussionService.listByLesson(lessonId),
    enabled: !!lessonId,
  });

  const askMutation = useMutation({
    mutationFn: () =>
      discussionService.createPost({
        title: title.trim() || `Hỏi về: ${lessonTitle ?? "bài học"}`,
        content: content.trim(),
        category: "qna",
        lesson_id: lessonId,
      }),
    onSuccess: () => {
      setTitle("");
      setContent("");
      void queryClient.invalidateQueries({ queryKey: lessonQnaKeys.byLesson(lessonId) });
    },
  });

  const voteMutation = useMutation({
    mutationFn: (postId: string) => discussionService.vote(postId, "upvote"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lessonQnaKeys.byLesson(lessonId) });
    },
  });

  const posts: ForumPost[] = data?.posts ?? [];
  const canSubmit = content.trim().length > 0 && !askMutation.isPending;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-100 p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tiêu đề câu hỏi (không bắt buộc)"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Bạn chưa hiểu chỗ nào?"
          className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => askMutation.mutate()}
            disabled={!canSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            {askMutation.isPending ? "Đang gửi..." : "Gửi câu hỏi"}
          </button>
        </div>
        {askMutation.isError && (
          <p className="mt-2 text-xs text-red-500">Chưa gửi được câu hỏi. Vui lòng thử lại.</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
          </div>
        ) : isError ? (
          // Review vòng 1 (#16): mất mạng/lỗi thật KHÔNG còn bị nuốt thành
          // "chưa có câu hỏi nào" — hiện đúng trạng thái + nút thử lại.
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-sm text-gray-500">Không tải được câu hỏi. Vui lòng thử lại.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Thử lại
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <MessageCircleQuestion className="h-8 w-8 text-gray-200" aria-hidden="true" />
            <p className="text-sm text-gray-500">{LESSON_QNA_EMPTY_MESSAGE}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id} className="rounded-xl border border-gray-100 bg-white p-3">
                <p className="text-sm font-medium text-gray-900">{post.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{post.content}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                  <span>{post.author_name}</span>
                  <div className="flex items-center gap-3">
                    <span>{post.reply_count} trả lời</span>
                    <button
                      type="button"
                      onClick={() => voteMutation.mutate(post.id)}
                      className="flex items-center gap-1 hover:text-primary-600"
                      aria-label="Hữu ích"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                      {post.upvote_count}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
