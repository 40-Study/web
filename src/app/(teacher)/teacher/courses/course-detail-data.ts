// ─── Shared types for teacher course detail views ──────────────────────────

export type TeacherCourseStatus = "published" | "draft";

/** Teacher-facing lesson type — superset of backend types */
export type LessonType = "video" | "quiz" | "sandbox" | "document";

export type TeacherAssignmentType = "quiz" | "code" | "document" | "project";
export type TeacherAssignmentStatus = "draft" | "published" | "closed";

export interface TeacherCourseLesson {
  id: string;
  title: string;
  type: LessonType;
  summary: string;
  content: string;
  status: "published" | "draft";
  duration?: string;
  questionCount?: number;
  fileSize?: string;
}

export interface TeacherCourseChapter {
  id: string;
  title: string;
  description: string;
  learningGoal: string;
  lessons: TeacherCourseLesson[];
}

export interface TeacherCourseDetail {
  id: string;
  title: string;
  status: TeacherCourseStatus;
  chapters: TeacherCourseChapter[];
}

export interface TeacherCourseSummary {
  id: string;
  title: string;
  status: TeacherCourseStatus;
}

export interface TeacherLessonComment {
  id: string;
  studentName: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface TeacherLessonAssignment {
  id: string;
  courseId: string;
  lessonId: string;
  title: string;
  type: TeacherAssignmentType;
  instructions: string;
  status: TeacherAssignmentStatus;
  dueAt: string;
  maxScore?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Pure utility (no side effects) ────────────────────────────────────────

/** Find a lesson across all chapters — returns { chapter, lesson } or null */
export function findLessonInChapters(chapters: TeacherCourseChapter[], lessonId: string) {
  for (const chapter of chapters) {
    const lesson = chapter.lessons.find((item) => item.id === lessonId);
    if (lesson) return { chapter, lesson };
  }
  return null;
}
