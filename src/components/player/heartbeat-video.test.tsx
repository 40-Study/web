/**
 * Review PR #26 MAJOR #2 — regression S-P0-4: sau khi server chốt
 * `status: "completed"` (hoặc mở khoá bài kế tiếp) cho một bài học, sidebar
 * player đọc `%` tiến độ từ `useMyEnrollments()` (key `enrollmentKeys.all`,
 * xem `use-enrollments.ts`) — thiếu invalidate đúng key này thì "Tiến độ: N%"
 * đứng yên ở số cũ tới khi remount trang hoặc hết `staleTime` 30s.
 *
 * Mock `VideoPlayer` (DOM video thật không chạy được trong jsdom) và
 * `useVideoProgress` (bắt lấy callback `onProgressChange` để tự bắn sự kiện
 * "server vừa chốt completed" mà không cần mô phỏng heartbeat thật).
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeartbeatVideo } from "./heartbeat-video";
import { enrollmentKeys } from "@/hooks/queries/use-enrollments";
import { courseKeys } from "@/hooks/queries/use-courses";
import { sectionKeys } from "@/hooks/queries/use-sections";
import type { LessonProgressResponse } from "@/services/enrollment.service";

let capturedOnProgressChange: ((p: LessonProgressResponse) => void) | undefined;

vi.mock("@/components/lesson/video-player", () => ({
  VideoPlayer: () => <div data-testid="video-player-stub" />,
}));

vi.mock("@/hooks/use-video-progress", () => ({
  useVideoProgress: (opts: { onProgressChange?: (p: LessonProgressResponse) => void }) => {
    capturedOnProgressChange = opts.onProgressChange;
    return {
      handleTimeUpdate: vi.fn(),
      flushNow: vi.fn(),
      progress: null,
      resumeSeconds: 0,
    };
  },
}));

function renderHeartbeatVideo(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <HeartbeatVideo src="https://example.com/v.mp4" lessonId="lesson-1" resumeSeconds={0} courseId="course-1" />
    </QueryClientProvider>
  );
}

describe("HeartbeatVideo — invalidate enrollments khi bài hoàn thành (MAJOR #2)", () => {
  afterEach(() => {
    capturedOnProgressChange = undefined;
  });

  it("status='completed' -> invalidate enrollmentKeys.all (cùng lúc với sectionKeys/courseKeys.enrolled đã có sẵn)", () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    renderHeartbeatVideo(qc);

    expect(capturedOnProgressChange).toBeTypeOf("function");
    capturedOnProgressChange!({
      lesson_id: "lesson-1",
      status: "completed",
      watched_seconds: 300,
      watched_pct: 100,
      last_position_seconds: 300,
      completed_at: "2026-09-27T00:00:00Z",
      next_lesson_unlocked: true,
    });

    const invalidatedKeys = spy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidatedKeys).toContainEqual(enrollmentKeys.all);
    expect(invalidatedKeys).toContainEqual(courseKeys.enrolled());
    expect(invalidatedKeys).toContainEqual(sectionKeys.byCourse("course-1"));
  });

  it("status='in_progress' và next_lesson_unlocked=false -> KHÔNG invalidate gì (tránh nhấp nháy sidebar mỗi 10s)", () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    renderHeartbeatVideo(qc);

    capturedOnProgressChange!({
      lesson_id: "lesson-1",
      status: "in_progress",
      watched_seconds: 50,
      watched_pct: 20,
      last_position_seconds: 50,
      completed_at: null,
      next_lesson_unlocked: false,
    });

    expect(spy).not.toHaveBeenCalled();
  });
});
