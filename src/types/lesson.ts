/**
 * TypeScript types for course lessons
 */

export interface Lesson {
  id: string;
  section_id: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  /** @deprecated use duration_minutes */
  duration?: number;
  is_preview?: boolean;
  is_mandatory?: boolean;
  display_order: number;
  /** @deprecated alias for display_order */
  position?: number;
  /** @deprecated content type is now on LessonContent */
  type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLessonDTO {
  title: string;
  description?: string;
  duration_minutes?: number;
  is_preview?: boolean;
  is_mandatory?: boolean;
}

export interface UpdateLessonDTO {
  title?: string;
  description?: string;
  duration_minutes?: number;
  is_preview?: boolean;
  is_mandatory?: boolean;
}
