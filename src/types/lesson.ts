/**
 * TypeScript types for course lessons
 */

export type LessonType = "video" | "article" | "quiz";

export interface Lesson {
  id: string;
  section_id: string;
  title: string;
  description?: string;
  type: LessonType;
  duration?: number;
  position: number;
  is_preview: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLessonDTO {
  title: string;
  description?: string;
  type: LessonType;
  duration?: number;
  position?: number;
  is_preview?: boolean;
}

export interface UpdateLessonDTO {
  title?: string;
  description?: string;
  type?: LessonType;
  duration?: number;
  position?: number;
  is_preview?: boolean;
}

export interface ReorderLessonsDTO {
  lesson_ids: string[];
}
