/**
 * QA6 S6-13: học viên chưa ghi danh mở /courses/:slug/exercises nhận một loạt 403 (`GET /lessons/:id/contents`) rồi
 * thấy "Khoá học chưa có bài tập nào" (sai). Trang phải chặn theo ghi danh TRƯỚC khi gọi API và nói rõ cần đăng ký.
 */

import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  role: "STUDENT" as string,
  getContents: vi.fn(),
  getByLesson: vi.fn(),
  getMyAttempts: vi.fn(),
  getEnrolled: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useParams: () => ({ slug: "flutter" }) }));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { activeRole: string }) => unknown) => selector({ activeRole: hoisted.role }),
}));
vi.mock("@/services/course.service", () => ({
  courseService: {
    getCourseBySlug: async () => ({ id: "c1", slug: "flutter", title: "Flutter", sections: [] }),
    getEnrolledCourses: hoisted.getEnrolled,
  },
}));
vi.mock("@/services/section.service", () => ({
  sectionService: {
    getSections: async () => [
      { id: "s1", course_id: "c1", title: "Chương 1", display_order: 1, lessons: [{ id: "l1", title: "Bài 1" }, { id: "l2", title: "Bài 2" }] },
    ],
  },
}));
vi.mock("@/services/lesson-content.service", () => ({
  lessonContentService: { getContents: hoisted.getContents },
}));
vi.mock("@/services/quiz.service", () => ({
  quizService: { getByLesson: hoisted.getByLesson, getMyAttempts: hoisted.getMyAttempts },
}));

import CourseExercisesPage from "./page";
import { renderWithProviders } from "@/test/utils";

beforeEach(() => {
  hoisted.role = "STUDENT";
  hoisted.getContents.mockReset().mockResolvedValue([]);
  hoisted.getByLesson.mockReset().mockResolvedValue([]);
  hoisted.getMyAttempts.mockReset().mockResolvedValue([]);
  hoisted.getEnrolled.mockReset();
});

describe("/courses/:slug/exercises — chặn theo ghi danh", () => {
  it("học viên chưa ghi danh: báo cần đăng ký, không gọi API nội dung bài học nào", async () => {
    hoisted.getEnrolled.mockResolvedValue([{ id: "other", slug: "khac", title: "Khoá khác" }]);
    renderWithProviders(<CourseExercisesPage />);

    expect(await screen.findByText("Đăng ký khoá học để xem bài tập")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Xem khoá học" }).getAttribute("href")).toBe("/courses/flutter");
    expect(screen.queryByText(/chưa có bài tập nào/)).toBeNull();
    expect(hoisted.getContents).not.toHaveBeenCalled();
    expect(hoisted.getByLesson).not.toHaveBeenCalled();
  });

  it("học viên đã ghi danh: tải nội dung từng bài như trước", async () => {
    hoisted.getEnrolled.mockResolvedValue([{ id: "c1", slug: "flutter", title: "Flutter" }]);
    renderWithProviders(<CourseExercisesPage />);

    await waitFor(() => expect(hoisted.getContents).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Khoá học chưa có bài tập nào.")).toBeTruthy();
    expect(screen.queryByText("Đăng ký khoá học để xem bài tập")).toBeNull();
  });

  it("giảng viên (không qua ghi danh): không bị chặn", async () => {
    hoisted.role = "TEACHER";
    hoisted.getEnrolled.mockResolvedValue([]);
    renderWithProviders(<CourseExercisesPage />);

    await waitFor(() => expect(hoisted.getContents).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("Đăng ký khoá học để xem bài tập")).toBeNull();
  });
});
