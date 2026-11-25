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
// S7-09 (C16): danh sách đi qua MỘT request `GET /me/assignments`, không còn mỗi buổi một request.
vi.mock("@/services/assignment.service", () => ({ assignmentService: { getMine: vi.fn() } }));

import { assignmentService } from "@/services/assignment.service";
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
    const page = (rows: unknown[]) => ({ data: rows, total: rows.length, page: 1, page_size: 100 });
    vi.mocked(assignmentService.getMine)
      .mockReset()
      .mockResolvedValueOnce(page([base]) as never)
      .mockResolvedValue(page([{ ...base, my_submission: { id: "x", status: "submitted", score: null, max_score: null } }]) as never);
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
    await waitFor(() => expect(assignmentService.getMine).toHaveBeenCalledTimes(2));
  });
});
