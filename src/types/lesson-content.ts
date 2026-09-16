/**
 * TypeScript types for lesson content (video, livestream, exercise)
 */

export type ContentType = "video" | "livestream" | "exercise";

export interface LessonContent {
  id: string;
  lesson_id: string;
  type: ContentType;
  title: string;
  video_url?: string;
  video_hls_url?: string; // HLS URL nếu đã xử lý xong
  thumbnail_url?: string;
  duration?: number;
  exercise_id?: string;
  /**
   * id PHIÊN livestream (M-6) — KHÁC `id` của lesson_content. Optional vì
   * response cũ chưa có trường; `null` = phiên chưa sẵn sàng.
   */
  livestream_session_id?: string | null;
  is_mandatory?: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

// Legacy aliases for backward compatibility
export type LessonVideo = LessonContent;
export type LessonArticle = LessonContent;
export type LessonAttachment = LessonContent;

export interface CreateLessonVideoDTO {
  type: "video";
  title: string;
  video_url: string;
  /**
   * Thời lượng video, tính bằng **GIÂY**.
   *
   * Vắng mặt (KHÔNG phải `0`) = "chưa biết": backend coi `0` y hệt chưa biết và
   * từ chối tính `watched_pct` (C-2), nên video ngoài hệ thống upload mà thiếu
   * trường này thì bài học không bao giờ đạt `completed` (C-6).
   */
  duration?: number;
  is_mandatory?: boolean;
}

export interface UpdateLessonVideoDTO {
  title?: string;
  duration?: number;
  is_mandatory?: boolean;
}

export interface CreateLessonArticleDTO {
  type: "exercise";
  title: string;
  exercise_id: string;
  is_mandatory?: boolean;
}

export interface UpdateLessonArticleDTO {
  title?: string;
  is_mandatory?: boolean;
}

export interface CreateLessonAttachmentDTO {
  type: "livestream";
  title: string;
  is_mandatory?: boolean;
}
