/**
 * Student dashboard types — mirrors backend DTOs for dashboard widgets
 */

export interface CurrentCourse {
  id: string;
  slug: string;
  currentLessonId: string;
  title: string;
  highlightedText: string;
  chapter: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

export interface DeadlineTask {
  id: string;
  title: string;
  dueDate: string;
  daysLeft: number;
}

export interface LiveClass {
  id: string;
  title: string;
  mentor: string;
  participants: number;
  startTime: string;
}

export interface RecommendedCourse {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  price: number;
  students: number;
  likes: number;
  duration: string;
}
