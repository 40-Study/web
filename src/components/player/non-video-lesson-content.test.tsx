/**
 * A2 (QA vòng 2, N6): bài tập không có video phải có lối hoàn thành — nút
 * "Đánh dấu hoàn thành" gửi `status: "completed"` (backend chỉ nhận field này
 * cho bài KHÔNG có video) và làm mới tiến độ.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NonVideoLessonContent } from "./non-video-lesson-content";
import { enrollmentKeys } from "@/hooks/queries/use-enrollments";

const updateProgress = vi.fn();

vi.mock("@/services/enrollment.service", () => ({
  enrollmentService: { updateProgress: (...args: unknown[]) => updateProgress(...args) },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderExercise(qc: QueryClient, completed = false) {
  return render(
    <QueryClientProvider client={qc}>
      <NonVideoLessonContent
        kind="exercise"
        lessonId="lesson-ex"
        courseId="course-1"
        courseSlug="react-nextjs"
        title="Bài tập thực hành: Todo App"
        description="Xây dựng ứng dụng Todo."
        completed={completed}
      />
    </QueryClientProvider>
  );
}

describe("NonVideoLessonContent — bài tập", () => {
  beforeEach(() => {
    updateProgress.mockReset();
  });

  it("bấm 'Đánh dấu hoàn thành' gửi status=completed rồi hiện 'Đã hoàn thành' và làm mới tiến độ", async () => {
    updateProgress.mockResolvedValue({
      lesson_id: "lesson-ex",
      status: "completed",
      watched_seconds: 0,
      watched_pct: 0,
      last_position_seconds: 0,
      completed_at: "2026-09-28T03:00:00Z",
      next_lesson_unlocked: true,
    });
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    renderExercise(qc);

    expect(screen.getByText("Xây dựng ứng dụng Todo.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Đánh dấu hoàn thành/ }));

    await waitFor(() => expect(screen.getByText("Đã hoàn thành")).toBeTruthy());
    expect(updateProgress).toHaveBeenCalledWith("lesson-ex", { status: "completed" });
    expect(spy).toHaveBeenCalledWith({ queryKey: enrollmentKeys.all });
  });

  it("bài đã hoàn thành theo curriculum: không hiện nút, không gọi API", () => {
    renderExercise(new QueryClient(), true);
    expect(screen.queryByRole("button", { name: /Đánh dấu hoàn thành/ })).toBeNull();
    expect(screen.getByText("Đã hoàn thành")).toBeTruthy();
    expect(updateProgress).not.toHaveBeenCalled();
  });
});
