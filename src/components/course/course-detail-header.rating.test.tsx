/**
 * QA-A-02: header chi tiết khoá học hiện "0.0 (0 đánh giá)" trong lúc GET /courses/:id/reviews còn đang chạy
 * (hoặc đã lỗi), mâu thuẫn với thẻ danh mục "5.0 (1)". Badge "Bestseller" thì gắn theo mức giảm giá.
 */

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/courses/khoa-a",
}));
vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { CourseDetailHeader } from "./course-detail-header";
import { resolveCourseRatingSummary } from "./course-rating-summary";
import { resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import type { CourseDetail } from "@/types/course";

const course = {
  id: "c1", title: "Khoá A", slug: "khoa-a", description: "Mô tả", price: 499000, originalPrice: 999000,
  studentCount: 1, language: "Tiếng Việt", rating: 5, reviewCount: 1,
  category: { id: "k", name: "Cat", slug: "cat" },
} as unknown as CourseDetail;

beforeEach(() => resetMockApi());

describe("CourseDetailHeader — số đánh giá (QA-A-02)", () => {
  it("đang tải: hiện khung chờ, KHÔNG hiện 0.0 hay 0 đánh giá", () => {
    renderWithProviders(<CourseDetailHeader course={course} ratingSummary={{ status: "loading" }} />);
    expect(screen.getByTestId("course-rating-loading")).toBeTruthy();
    expect(screen.queryByText("0.0")).toBeNull();
    expect(screen.queryByText(/0 đánh giá/)).toBeNull();
  });

  it("đã có số liệu: hiện điểm và số đánh giá thật", () => {
    renderWithProviders(<CourseDetailHeader course={course} ratingSummary={{ status: "ready", average: 5, total: 1 }} />);
    expect(screen.getByText("5.0")).toBeTruthy();
    expect(screen.getByText("(1 đánh giá)")).toBeTruthy();
  });

  it("thật sự chưa có đánh giá: nói 'Chưa có đánh giá', không in 0.0", () => {
    renderWithProviders(<CourseDetailHeader course={course} ratingSummary={{ status: "ready", average: 0, total: 0 }} />);
    expect(screen.getByText("Chưa có đánh giá")).toBeTruthy();
    expect(screen.queryByText("0.0")).toBeNull();
  });

  it("giảm giá thì ghi đúng là giảm giá, không gắn 'Bestseller'", () => {
    renderWithProviders(<CourseDetailHeader course={course} ratingSummary={{ status: "loading" }} />);
    expect(screen.queryByText("Bestseller")).toBeNull();
    expect(screen.getByText("Giảm 50%")).toBeTruthy();
  });
});

describe("resolveCourseRatingSummary", () => {
  const fallback = { rating: 4, reviewCount: 1 };

  it("chưa có dữ liệu, chưa lỗi: đang tải", () => {
    expect(resolveCourseRatingSummary({ reviews: undefined, isError: false, fallback })).toEqual({ status: "loading" });
  });

  it("có dữ liệu reviews: dùng reviews (average có thể là chuỗi decimal)", () => {
    expect(
      resolveCourseRatingSummary({ reviews: { average_rating: "5.00", total: 1 }, isError: false, fallback })
    ).toEqual({ status: "ready", average: 5, total: 1 });
  });

  it("reviews lỗi: dùng cột lưu sẵn của khoá (cùng nguồn với thẻ danh mục), không bịa ra 0", () => {
    expect(resolveCourseRatingSummary({ reviews: undefined, isError: true, fallback })).toEqual({
      status: "ready",
      average: 4,
      total: 1,
    });
  });
});
