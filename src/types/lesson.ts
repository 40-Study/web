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
  /**
   * Khoá tuần tự (contract §2). Server quyết định — bài chưa mở trả `true` kèm
   * `lock_reason`; khoá học không bật tuần tự thì luôn `false`.
   */
  locked?: boolean;
  /** `previous_incomplete` | `not_enrolled` | null — contract §2. */
  lock_reason?: string | null;
  /** Tiến độ của CHÍNH người đang xem, gắn kèm curriculum (contract §2). */
  progress?: LessonProgressSummary | null;
}

/** Tiến độ tóm tắt gắn trong curriculum (contract §2). */
export interface LessonProgressSummary {
  status: "not_started" | "in_progress" | "completed";
  watched_pct: number;
  last_position_seconds: number;
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
