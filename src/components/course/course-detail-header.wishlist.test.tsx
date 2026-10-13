/**
 * QA2 F-10: trang chi tiết khoá học cần một nút lưu yêu thích hoạt động (hai tim trong course-hero.tsx không
 * có onClick và không trang nào dùng tới). Người đã ghi danh không cần lưu khoá mình đang học.
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
import { resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import type { CourseDetail } from "@/types/course";

const course = {
  id: "c1", title: "Khoá A", slug: "khoa-a", description: "Mô tả", price: 500000, studentCount: 10, language: "Tiếng Việt",
  category: { id: "k", name: "Cat", slug: "cat" },
} as unknown as CourseDetail;

beforeEach(() => resetMockApi());

describe("CourseDetailHeader — lưu yêu thích", () => {
  it("chưa ghi danh: có nút 'Lưu vào yêu thích' cho đúng khoá này", () => {
    renderWithProviders(<CourseDetailHeader course={course} />);
    expect(screen.getByRole("button", { name: "Thêm vào danh sách yêu thích" })).toBeTruthy();
    expect(screen.getByText("Lưu vào yêu thích")).toBeTruthy();
  });

  it("đã ghi danh: không hiện nút", () => {
    renderWithProviders(<CourseDetailHeader course={course} isEnrolled />);
    expect(screen.queryByRole("button", { name: /yêu thích/ })).toBeNull();
  });
});
