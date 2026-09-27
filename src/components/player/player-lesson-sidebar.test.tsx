/**
 * QA 260927 S-P0-4 — sidebar bài học phải hiển thị tiến độ % từ SERVER
 * (`enrollment.progress_percentage`), KHÔNG tự tính lại từ completed/total ở
 * client. Trước đây `/learn` hiện 56% (tính lại tại client) trong khi
 * `/courses/[slug]` và `/my-courses` cùng lúc hiện 65% (server) — cùng một
 * khoá, 2 con số khác nhau.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlayerLessonSidebar } from "./player-lesson-sidebar";
import type { PlayerChapter } from "@/types/course-player";

// 5/9 bài hoàn thành -> nếu còn tự tính ở client sẽ ra 56%, khác hẳn số
// server giả lập bên dưới (65%) — bắt được ngay nếu ai revert fix.
const CHAPTERS: PlayerChapter[] = [
  {
    id: "ch1",
    title: "Chương 1",
    lessons: Array.from({ length: 9 }, (_, i) => ({
      id: `lesson-${i}`,
      title: `Bài ${i + 1}`,
      duration: "05:00",
      type: "video" as const,
      completed: i < 5,
      locked: false,
    })),
  },
];

describe("PlayerLessonSidebar — nguồn tiến độ (S-P0-4)", () => {
  it("hiển thị đúng serverProgressPct, không tự tính lại completed/total (56% != 65%)", () => {
    render(
      <PlayerLessonSidebar
        chapters={CHAPTERS}
        currentLessonId="lesson-4"
        courseSlug="demo-course"
        serverProgressPct={65}
      />
    );

    expect(screen.getByText("Tiến độ: 65%")).toBeTruthy();
    expect(screen.queryByText("Tiến độ: 56%")).toBeNull();
    // Số đếm bài x/y vẫn hiển thị (thông tin riêng, không phải % tiến độ)
    expect(screen.getByText("5/9 bài học")).toBeTruthy();
  });

  it("chưa có dữ liệu enrollment (undefined) -> hiển thị 0%, không rơi về công thức client", () => {
    render(
      <PlayerLessonSidebar
        chapters={CHAPTERS}
        currentLessonId="lesson-4"
        courseSlug="demo-course"
      />
    );

    expect(screen.getByText("Tiến độ: 0%")).toBeTruthy();
  });
});
