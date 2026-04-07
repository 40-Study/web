/**
 * Course player types — shared between player components and pages
 */

export interface PlayerLesson {
  id: string;
  title: string;
  duration: string; // e.g. "06:30"
  type: "video" | "quiz" | "exercise" | "reading";
  completed: boolean;
  locked: boolean;
  videoUrl?: string;
}

export interface PlayerChapter {
  id: string;
  title: string;
  lessons: PlayerLesson[];
}

export interface PlayerCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructor: {
    name: string;
    avatar?: string;
    title: string;
    rating: number;
    studentCount: number;
    courseCount: number;
  };
  rating: number;
  reviewCount: number;
  level: string;
  language: string;
  chapters: PlayerChapter[];
  resources: PlayerResource[];
  reviews: PlayerReview[];
}

export interface PlayerResource {
  id: string;
  title: string;
  type: "pdf" | "zip" | "link";
  url: string;
  size?: string;
}

export interface PlayerReview {
  id: string;
  user: { name: string; avatar?: string };
  rating: number;
  content: string;
  createdAt: string;
}

/** Get lesson by ID from course chapters */
export function getLessonById(course: PlayerCourse, lessonId: string): PlayerLesson | undefined {
  for (const chapter of course.chapters) {
    const lesson = chapter.lessons.find((l) => l.id === lessonId);
    if (lesson) return lesson;
  }
  return undefined;
}

/** Get adjacent lessons (prev/next) relative to lessonId */
export function getAdjacentLessons(
  course: PlayerCourse,
  lessonId: string
): { prev?: PlayerLesson; next?: PlayerLesson } {
  const allLessons = course.chapters.flatMap((ch) => ch.lessons);
  const idx = allLessons.findIndex((l) => l.id === lessonId);
  return {
    prev: idx > 0 ? allLessons[idx - 1] : undefined,
    next: idx < allLessons.length - 1 ? allLessons[idx + 1] : undefined,
  };
}
