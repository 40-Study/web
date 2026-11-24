import { describe, expect, it } from "vitest";
import type { ApiCourse } from "@/services/course.service";
import { teachingStats } from "./teacher-profile-summary";

const course = (over: Partial<ApiCourse>) => ({ id: "c", title: "x", ...over }) as ApiCourse;

describe("teachingStats (Q4-T10)", () => {
  it("không có khoá: 0 và chưa có đánh giá", () => {
    expect(teachingStats([])).toEqual({ courseCount: 0, publishedCount: 0, averageRating: null, reviewCount: 0 });
  });

  it("điểm trung bình theo số lượt đánh giá; khoá chưa có đánh giá không kéo điểm về 0", () => {
    const s = teachingStats([
      course({ status: "published", total_students: 5, average_rating: "4.0", total_reviews: 3 }),
      course({ status: "draft", total_students: 1, average_rating: 0, total_reviews: 0 }),
      course({ status: "published", total_students: 4, average_rating: 5, total_reviews: 1 }),
    ]);
    expect(s.courseCount).toBe(3);
    expect(s.publishedCount).toBe(2);
    expect(s.reviewCount).toBe(4);
    expect(s.averageRating).toBeCloseTo(4.25);
  });
});
