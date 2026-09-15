/**
 * Discussion forum service — list, get, create posts, comments, and votes
 */

import { api } from "@/lib/api-client";
import { NetworkError, NotFoundError } from "@/lib/errors";
import type { ForumPost, ForumPostListResponse, ForumPostDetail, ForumComment } from "@/types/discussion";

type ApiResponse<T> = { message: string; data: T };

/** Backend chưa có route ⇒ coi như "chưa có dữ liệu", không phải lỗi của người học. */
function isMissingEndpoint(error: unknown): boolean {
  return error instanceof NotFoundError || error instanceof NetworkError;
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
   * Endpoint này chưa có trên backend đang chạy: 404/network được coi là "chưa có
   * câu hỏi nào" và trả danh sách rỗng, vì panel hỏi đáp phải ẩn sạch chứ không
   * được đỏ lỗi cho người học. Lỗi khác (401/403/5xx) vẫn ném ra bình thường.
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
