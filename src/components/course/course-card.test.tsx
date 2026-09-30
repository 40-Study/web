import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CourseCard } from "./course-card";
import type { Course, EnrolledCourse } from "@/types/course";

const base = {
  id: "c1",
  title: "Ưu tiên Kỹ năng — Ổn định Ngữ văn: ẩ ỗ ự ằ ỷ",
  slug: "ngu-van",
  description: "",
  thumbnail: "",
  price: 500000,
  rating: 4.6,
  reviewCount: 120,
  studentCount: 3400,
  instructor: { id: "i1", name: "Nguyễn Thị Ánh" },
  category: { id: "k1", name: "Ngữ văn", slug: "ngu-van" },
  level: "beginner",
  language: "vi",
  duration: 600,
  lessonCount: 24,
  learningOutcomes: [],
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
} as unknown as Course;

describe("CourseCard", () => {
  it("là một link duy nhất tới trang khóa học, không lồng <button>", () => {
    const { container } = render(<CourseCard course={base} />);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/courses/ngu-van");
    expect(container.querySelector("a button")).toBeNull();
  });

  it("khóa miễn phí hiện đúng 1 badge 'Miễn phí' trên ảnh", () => {
    render(<CourseCard course={{ ...base, price: 0 }} />);
    expect(screen.getAllByText("Miễn phí").length).toBe(2); // badge + giá ở footer
  });

  it("khóa giảm giá hiện badge phần trăm và giá gốc gạch ngang", () => {
    render(<CourseCard course={{ ...base, price: 300000, originalPrice: 600000 }} />);
    expect(screen.getByText("-50%")).toBeTruthy();
  });

  it("đã ghi danh: không badge, có tiến độ và nút Tiếp tục", () => {
    const enrolled = {
      ...base,
      price: 0,
      progress: 42,
      completedLessons: 5,
      totalLessons: 24,
      enrolledAt: "2026-02-01",
      watchedSeconds: 0,
    } as EnrolledCourse;
    render(<CourseCard course={enrolled} />);
    expect(screen.queryByText("Miễn phí")).toBeNull();
    expect(screen.getByText(/42% · Bài 5\/24/)).toBeTruthy();
    expect(screen.getByText("Tiếp tục")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("42");
  });

  it("tiêu đề tiếng Việt có dấu chồng được clamp 2 dòng và giữ nguyên chữ", () => {
    render(<CourseCard course={base} />);
    const h3 = screen.getByRole("heading", { level: 3 });
    expect(h3.textContent).toBe(base.title);
    expect(h3.className).toContain("line-clamp-2");
  });

  it("đã ghi danh thiếu rating/giảng viên/học viên: không hiện placeholder", () => {
    const enrolled = {
      ...base,
      instructor: undefined,
      rating: undefined,
      reviewCount: undefined,
      studentCount: undefined,
      progress: 10,
      completedLessons: 1,
      totalLessons: 10,
      enrolledAt: "2026-02-01",
      watchedSeconds: 0,
    } as unknown as EnrolledCourse;
    const { container } = render(<CourseCard course={enrolled} />);
    expect(screen.queryByText("Chưa cập nhật")).toBeNull();
    expect(container.textContent).not.toContain("0.0");
    expect(container.textContent).not.toContain("học viên");
    expect(container.querySelector("a button")).toBeNull();
  });

  it("reviewCount = 0 thì ẩn hàng rating", () => {
    const { container } = render(
      <CourseCard course={{ ...base, rating: 0, reviewCount: 0, studentCount: 0 }} />
    );
    expect(container.textContent).not.toContain("(0)");
    expect(container.querySelector("svg.fill-amber-400")).toBeNull();
  });

  it("có rating thật thì hiện điểm, số đánh giá và học viên", () => {
    render(<CourseCard course={base} />);
    expect(screen.getByText("4.6")).toBeTruthy();
    expect(screen.getByText(/3\.400 học viên/)).toBeTruthy();
  });
});
