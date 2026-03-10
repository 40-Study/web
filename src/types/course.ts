/**
 * Course-related type definitions
 */

import { BaseEntity, ID } from "./common";

export interface Instructor {
  id: ID;
  name: string;
  avatar?: string;
  title?: string;
  bio?: string;
  courseCount?: number;
  studentCount?: number;
  rating?: number;
}

export interface Category {
  id: ID;
  name: string;
  slug: string;
  icon?: string;
}

export interface Lesson {
  id: ID;
  title: string;
  duration: number; // in minutes
  type: "video" | "quiz" | "reading" | "exercise";
  isFreePreview?: boolean;
  completed?: boolean;
  order: number;
}

export interface Section {
  id: ID;
  title: string;
  lessons: Lesson[];
  duration: number; // total duration in minutes
  completedLessons?: number;
  order: number;
}

export interface Review {
  id: ID;
  user: {
    id: ID;
    name: string;
    avatar?: string;
  };
  rating: number;
  content: string;
  createdAt: string;
  helpful?: number;
}

export interface Course extends BaseEntity {
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  studentCount: number;
  instructor: Instructor;
  category: Category;
  level: "beginner" | "intermediate" | "advanced";
  language: string;
  duration: number; // total duration in minutes
  lessonCount: number;
  learningOutcomes: string[];
  requirements?: string[];
  isFeatured?: boolean;
  isPublished?: boolean;
}

export interface CourseDetail extends Course {
  sections: Section[];
  reviews: Review[];
  ratingDistribution: Record<number, number>; // e.g., { 5: 60, 4: 25, 3: 10, 2: 3, 1: 2 }
  previewVideoUrl?: string;
}

export interface EnrolledCourse extends Course {
  progress: number; // percentage
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt?: string;
  enrolledAt: string;
}

export interface CourseFilters {
  category?: string;
  levels?: string[];
  priceRange?: "free" | "paid" | "all";
  minRating?: number;
  sortBy?: "popular" | "newest" | "rating" | "price-low" | "price-high";
}

export interface CourseSearchResult {
  id: ID;
  title: string;
  thumbnail: string;
  instructor: string;
  slug: string;
}
