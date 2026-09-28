/**
 * A3 + A5 (QA vòng 2, N16/N7): tab Quiz hiện quiz THẬT của bài; tab Đánh giá
 * dùng số liệu thật từ API và có form viết; không còn tab "Hỏi & Đáp" giữ chỗ.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlayerTabs } from "./player-tabs";
import type { PlayerCourse } from "@/types/course-player";
import type { Quiz } from "@/services/quiz.service";

vi.mock("@/hooks/queries/use-reviews", () => ({
  useCourseReviews: () => ({
    data: { data: [], total: 2, page: 1, page_size: 10, average_rating: 4.5 },
    isLoading: false,
    isError: false,
  }),
  useCreateReview: () => ({ mutate: vi.fn(), isPending: false }),
}));

const course: PlayerCourse = {
  id: "course-1",
  title: "Git & GitHub",
  slug: "git",
  description: "Mô tả",
  // Seed cũ ghi cứng 318 — tab không được dùng con số này nữa.
  reviewCount: 318,
  rating: 4.8,
  instructor: { name: "Nguyễn Văn A", title: "", rating: 0, studentCount: 0, courseCount: 0 },
  level: "Cơ bản",
  language: "Tiếng Việt",
  chapters: [],
  resources: [],
  reviews: [],
};

const quiz: Quiz = {
  id: "quiz-1",
  title: "Kiểm tra: Cài đặt và cấu hình Git",
  trigger_type: "manual",
  time_limit_minutes: 15,
  max_attempts: 5,
} as Quiz;

function renderTabs(lessonQuizzes?: Quiz[]) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <PlayerTabs course={course} lessonQuizzes={lessonQuizzes} />
    </QueryClientProvider>
  );
}

describe("PlayerTabs", () => {
  it("tab Quiz liệt kê quiz của bài và dẫn tới trang làm bài", () => {
    renderTabs([quiz]);
    fireEvent.click(screen.getByRole("button", { name: "Quiz (1)" }));
    const link = screen.getByRole("link", { name: /Kiểm tra: Cài đặt và cấu hình Git/ });
    expect(link.getAttribute("href")).toBe("/quizzes/quiz-1");
    expect(screen.getByText(/15 phút · Tối đa 5 lần làm/)).toBeTruthy();
  });

  it("bài không có quiz -> thông báo rỗng tiếng Việt có dấu", () => {
    renderTabs([]);
    fireEvent.click(screen.getByRole("button", { name: "Quiz" }));
    expect(screen.getByText("Bài học này chưa có bài kiểm tra.")).toBeTruthy();
  });

  it("tab Đánh giá dùng tổng số THẬT từ API và có form viết", () => {
    renderTabs();
    expect(screen.queryByRole("button", { name: /318/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Đánh giá (2)" }));
    expect(screen.getByText("Viết đánh giá của bạn")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Gửi đánh giá" })).toBeTruthy();
  });

  it("không còn tab 'Hỏi & Đáp' giữ chỗ", () => {
    renderTabs();
    expect(screen.queryByRole("button", { name: /Hỏi & Đáp/ })).toBeNull();
  });
});
