/**
 * TypeScript types for lesson content (video, article, attachments)
 */

export interface LessonVideo {
  id: string;
  lesson_id: string;
  video_upload_id: string;
  hls_url?: string;
  duration: number;
  created_at?: string;
  updated_at?: string;
}

export interface LessonArticle {
  id: string;
  lesson_id: string;
  /** HTML or Markdown content */
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface LessonAttachment {
  id: string;
  lesson_id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  created_at?: string;
}

export interface CreateLessonVideoDTO {
  video_upload_id: string;
  duration?: number;
}

export interface UpdateLessonVideoDTO {
  video_upload_id?: string;
  duration?: number;
}

export interface CreateLessonArticleDTO {
  content: string;
}

export interface UpdateLessonArticleDTO {
  content: string;
}

export interface CreateLessonAttachmentDTO {
  name: string;
  url: string;
  size: number;
  type: string;
}
