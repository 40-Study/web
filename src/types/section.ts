/**
 * TypeScript types for course sections
 */

export interface Section {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  display_order: number;
  /** @deprecated alias for display_order */
  position?: number;
  lessons?: import("./lesson").Lesson[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateSectionDTO {
  title: string;
  description?: string;
}

export interface UpdateSectionDTO {
  title?: string;
  description?: string;
}
