/**
 * QA2 F-10: trái tim lưu khoá học trên thẻ khoá học (opt-in qua `showWishlist`). Tim là phần tử anh em của link
 * thẻ, KHÔNG lồng trong <a> (button trong anchor là HTML sai và click sẽ điều hướng).
 */

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/courses",
}));
vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { CourseCard } from "./course-card";
import { CourseGrid } from "./course-grid";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import type { Course, EnrolledCourse } from "@/types/course";

const course = {
  id: "c1", title: "Khoá A", slug: "khoa-a", description: "", thumbnail: "", price: 500000, rating: 0, reviewCount: 0,
  studentCount: 0, instructor: { id: "i1", name: "GV" }, category: { id: "k", name: "Cat", slug: "cat" }, level: "beginner",
} as unknown as Course;

beforeEach(() => {
  resetMockApi();
  mockApi.get.mockResolvedValue(envelope({ course_ids: [] }));
});

describe("CourseCard — wishlist", () => {
  it("mặc định không có tim (các nơi chưa opt-in không đổi)", () => {
    renderWithProviders(<CourseCard course={course} />);
    expect(screen.queryByRole("button", { name: /yêu thích/ })).toBeNull();
  });

  it("showWishlist: có tim, nằm NGOÀI link của thẻ", () => {
    const { container } = renderWithProviders(<CourseCard course={course} showWishlist />);
    const heart = screen.getByRole("button", { name: "Thêm vào danh sách yêu thích" });
    expect(container.querySelector("a button")).toBeNull();
    expect(heart.closest("a")).toBeNull();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/courses/khoa-a");
  });

  it("khoá đã ghi danh: không có tim dù showWishlist", () => {
    const enrolled = { ...course, progress: 10, completedLessons: 1, totalLessons: 10 } as unknown as EnrolledCourse;
    renderWithProviders(<CourseCard course={enrolled} showWishlist />);
    expect(screen.queryByRole("button", { name: /yêu thích/ })).toBeNull();
  });

  it("CourseGrid chuyển showWishlist xuống từng thẻ", () => {
    renderWithProviders(<CourseGrid courses={[course, { ...course, id: "c2", slug: "khoa-b" }]} showWishlist />);
    expect(screen.getAllByRole("button", { name: "Thêm vào danh sách yêu thích" })).toHaveLength(2);
  });
});
