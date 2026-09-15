/**
 * Discussion forum service — list, get, create posts, comments, and votes
 */

import { api } from "@/lib/api-client";
import { NotFoundError } from "@/lib/errors";
import type { ForumPost, ForumPostListResponse, ForumPostDetail, ForumComment } from "@/types/discussion";

type ApiResponse<T> = { message: string; data: T };

/**
 * Backend trả 404 (route không tồn tại) ⇒ coi như "chưa có dữ liệu", không
 * phải lỗi của người học.
 *
 * Review vòng 1 (#16): trước đây gộp CẢ `NetworkError` vào đây — mất mạng bị
 * hiển thị y hệt "chưa có câu hỏi nào", nuốt mất tín hiệu lỗi thật. `NetworkError`
 * KHÔNG được coi là thiếu endpoint; nó phải ném ra để UI hiện "Không tải được,
 * thử lại" thay vì một empty-state trông giống hệt trạng thái bình thường.
 */
function isMissingEndpoint(error: unknown): boolean {
  return error instanceof NotFoundError;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const discussionService = {
  /** GET /discussions — list posts with optional category/page filter */
  listPosts: (params?: { category?: string; page?: number; page_size?: number }) =>
    api
      .get<ApiResponse<ForumPostListResponse>>("/discussions", { params })
      .then((r) => r.data.data),

  /** GET /discussions/:slug — single post with comments */
  getPostBySlug: (slug: string) =>
    api
      .get<ApiResponse<ForumPostDetail>>(`/discussions/${slug}`)
      .then((r) => r.data.data),

  /** POST /discussions — create new post (auth required) */
  createPost: (data: { title: string; content: string; category: string; lesson_id?: string }) =>
    api
      .post<ApiResponse<ForumPost>>("/discussions", data)
      .then((r) => r.data.data),

  /**
   * GET /lessons/:lessonId/discussions — hỏi đáp theo bài (contract §5).
   *
   * 404 (route chưa triển khai ở môi trường đang chạy) ⇒ trả danh sách rỗng,
   * panel hiện empty state chứ không đỏ lỗi cho người học. Mọi lỗi KHÁC —
   * kể cả mất mạng — vẫn ném ra để UI phân biệt được "chưa có câu hỏi" với
   * "không tải được" (review vòng 1, #16).
   */
  listByLesson: async (lessonId: string, params?: { page?: number; limit?: number }) => {
    try {
      return await api
        .get<ApiResponse<ForumPostListResponse>>(`/lessons/${lessonId}/discussions`, { params })
        .then((r) => r.data.data);
    } catch (error) {
      if (isMissingEndpoint(error)) return { posts: [], total: 0, page: 1, page_size: 0 };
      throw error;
    }
  },

  /** POST /discussions/:slug/comments — add comment (auth required) */
  addComment: (slug: string, data: { content: string; parent_id?: string }) =>
    api
      .post<ApiResponse<ForumComment>>(`/discussions/${slug}/comments`, data)
      .then((r) => r.data.data),

  /** POST /discussions/:id/vote — upvote post or comment */
  vote: (id: string, voteType: string) =>
    api
      .post<ApiResponse<unknown>>(`/discussions/${id}/vote`, { vote_type: voteType })
      .then((r) => r.data.data),

  /** DELETE /discussions/:id/vote — remove vote */
  removeVote: (id: string) =>
    api
      .delete<ApiResponse<unknown>>(`/discussions/${id}/vote`)
      .then((r) => r.data.data),

  /** DELETE /discussions/:id — delete post (auth required) */
  deletePost: (id: string) =>
    api
      .delete<ApiResponse<unknown>>(`/discussions/${id}`)
      .then((r) => r.data.data),
};
