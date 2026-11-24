/**
 * QA5 review #127, mục 3: nộp bài rồi đóng màn làm bài mà danh sách vẫn ghi "Làm bài ngay" (staleTime 30 s,
 * không tải lại khi focus). Dùng QueryClient thật của app (`createAppQueryClient`), không mock `useQuery`.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppQueryClient } from "@/lib/query-client";

const future = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
const base = {
  id: "a1", title: "Bài một", description: "", language: ["python"], is_published: true, end_time: future,
  allow_late_submission: false, max_late_days: 0, grace_period_minutes: 0,
};

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { user?: { id: string } }) => unknown) => selector({ user: { id: "student-1" } }),
}));
vi.mock("next/dynamic", () => ({
  default: () =>
    function WorkOverlayStub(props: { onClose: (w?: boolean) => void; onSubmitted?: () => void }) {
      return (
        <div>
          <button onClick={() => props.onSubmitted?.()}>nop-xong</button>
          <button onClick={() => props.onClose(true)}>dong-bai</button>
        </div>
      );
    },
}));
vi.mock("@/services/livestream-classroom.service", () => ({
  livestreamClassroomService: { listSessions: vi.fn(), getAssignments: vi.fn() },
}));

import { livestreamClassroomService } from "@/services/livestream-classroom.service";
import MyAssignmentsPage from "./page";

function renderPage() {
  return render(
    <QueryClientProvider client={createAppQueryClient()}>
      <MyAssignmentsPage />
    </QueryClientProvider>,
  );
}

describe("/my-assignments — làm mới sau khi làm bài", () => {
  beforeEach(() => {
    vi.mocked(livestreamClassroomService.listSessions).mockResolvedValue([{ id: "s1" }] as never);
    vi.mocked(livestreamClassroomService.getAssignments)
      .mockReset()
      .mockResolvedValueOnce([base] as never)
      .mockResolvedValue([{ ...base, my_submission: { id: "x", status: "submitted", score: null, max_score: null } }] as never);
  });

  it("đóng màn làm bài thì danh sách tải lại: 'Làm bài ngay' thành 'Xem bài nộp'", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Làm bài ngay" }));
    fireEvent.click(screen.getByRole("button", { name: "dong-bai" }));
    expect(await screen.findByRole("button", { name: "Xem bài nộp" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Làm bài ngay" })).toBeNull();
  });

  it("nộp thành công (màn còn mở) cũng làm mới danh sách phía sau", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Làm bài ngay" }));
    fireEvent.click(screen.getByRole("button", { name: "nop-xong" }));
    await waitFor(() => expect(livestreamClassroomService.getAssignments).toHaveBeenCalledTimes(2));
  });
});
