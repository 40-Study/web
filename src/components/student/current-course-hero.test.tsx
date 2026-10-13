/**
 * F-11 (QA2 261013): trang Khoá học của tôi tự suy số bài đã học từ % (làm tròn) trong khi trang chủ lấy số thật
 * từ API -> hai nơi lệch nhau. Mọi nơi phải đọc `completedLessons` của API.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EnrolledCourse } from "@/types/course";

vi.mock("next/image", () => ({ default: () => null }));

import { CurrentCourseHero } from "./current-course-hero";

describe("CurrentCourseHero", () => {
  it("hiện số bài đã học thật của API, không suy từ phần trăm", () => {
    // 45% của 10 bài làm tròn ra 5 (Math.round(4.5)), nhưng API nói mới xong 4 bài.
    const course = { slug: "x", title: "Khoá X", progress: 45, completedLessons: 4, totalLessons: 10 } as EnrolledCourse;
    render(<CurrentCourseHero course={course} />);
    expect(screen.getByText("4/10 bài học")).toBeTruthy();
  });
});
