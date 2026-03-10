"use client";

import { useQuery } from "@tanstack/react-query";
import {
  mockCourses,
  mockCategories,
  getMockCourseDetail,
  mockSearchResults,
  mockEnrolledCourses,
} from "@/lib/mock-data/courses";
import { Course, CourseDetail, CourseFilters, Category } from "@/types/course";

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Filter and sort courses based on filters
function filterCourses(courses: Course[], filters: CourseFilters): Course[] {
  let filtered = [...courses];

  // Category filter
  if (filters.category) {
    filtered = filtered.filter((c) => c.category.slug === filters.category);
  }

  // Level filter
  if (filters.levels && filters.levels.length > 0) {
    filtered = filtered.filter((c) => filters.levels!.includes(c.level));
  }

  // Price filter
  if (filters.priceRange === "free") {
    filtered = filtered.filter((c) => c.price === 0);
  } else if (filters.priceRange === "paid") {
    filtered = filtered.filter((c) => c.price > 0);
  }

  // Rating filter
  if (filters.minRating) {
    filtered = filtered.filter((c) => c.rating >= filters.minRating!);
  }

  // Sort
  switch (filters.sortBy) {
    case "newest":
      filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case "rating":
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    case "price-low":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "popular":
    default:
      filtered.sort((a, b) => b.studentCount - a.studentCount);
      break;
  }

  return filtered;
}

// Hook to fetch all courses with filters
export function useCourses(filters: CourseFilters = {}) {
  return useQuery({
    queryKey: ["courses", filters],
    queryFn: async () => {
      await delay(500); // Simulate network delay
      return filterCourses(mockCourses, filters);
    },
  });
}

// Hook to fetch course detail by slug
export function useCourseDetail(slug: string) {
  return useQuery({
    queryKey: ["course", slug],
    queryFn: async (): Promise<CourseDetail | null> => {
      await delay(300);
      return getMockCourseDetail(slug);
    },
    enabled: !!slug,
  });
}

// Hook to fetch categories
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      await delay(200);
      return mockCategories;
    },
  });
}

// Hook for search suggestions
export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: async () => {
      await delay(150);
      if (query.length < 2) return [];
      return mockSearchResults.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.instructor.toLowerCase().includes(query.toLowerCase())
      );
    },
    enabled: query.length >= 2,
  });
}

// Hook to fetch enrolled courses
export function useEnrolledCourses() {
  return useQuery({
    queryKey: ["enrolled-courses"],
    queryFn: async () => {
      await delay(300);
      return mockEnrolledCourses;
    },
  });
}

// Hook to fetch featured courses
export function useFeaturedCourses() {
  return useQuery({
    queryKey: ["featured-courses"],
    queryFn: async () => {
      await delay(300);
      return mockCourses.filter((c) => c.isFeatured);
    },
  });
}
