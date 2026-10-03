/**
 * A-02 (QA hồi quy 03/10/2026): nút "Làm bài ngay" ở /my-assignments là <button> không có onClick, nên bấm
 * không làm gì. A-07: trang phải có lối vào "Điểm của tôi".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const future = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
const past = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

const ASSIGNMENTS = [
  { id: "a-open", title: "Bài đang mở", description: "", language: ["python"], is_published: true, end_time: future, allow_late_submission: false, max_late_days: 0, grace_period_minutes: 0 },
  { id: "a-closed", title: "Bài đã đóng", description: "", language: ["python"], is_published: true, end_time: past, allow_late_submission: false, max_late_days: 0, grace_period_minutes: 0 },
];

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: ASSIGNMENTS, isLoading: false }),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { user?: { id: string } }) => unknown) => selector({ user: { id: "student-1" } }),
}));

// next/dynamic bọc import động bằng lazy (cần Suspense); thay bằng component đồng bộ ghi lại props.
vi.mock("next/dynamic", () => ({
  default: () =>
    function WorkOverlayStub(props: { assignmentId: string; userId: string; onClose: () => void }) {
      return (
        <div data-testid="work-overlay">
          <span>{props.assignmentId}</span>
          <span>{props.userId}</span>
          <button onClick={props.onClose}>dong-bai</button>
        </div>
      );
    },
}));

vi.mock("@/services/livestream-classroom.service", () => ({
  livestreamClassroomService: { listSessions: vi.fn(), getAssignments: vi.fn() },
}));

// eslint-disable-next-line import/first
import MyAssignmentsPage from "./page";

describe("/my-assignments — làm bài và điểm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("'Làm bài ngay' mở màn làm bài của đúng bài tập, với id học viên đang đăng nhập", () => {
    render(<MyAssignmentsPage />);
    expect(screen.queryByTestId("work-overlay")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Làm bài ngay" }));

    const overlay = screen.getByTestId("work-overlay");
    expect(overlay.textContent).toContain("a-open");
    expect(overlay.textContent).toContain("student-1");
  });

  it("đóng màn làm bài thì quay lại danh sách", () => {
    render(<MyAssignmentsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Làm bài ngay" }));
    fireEvent.click(screen.getByRole("button", { name: "dong-bai" }));

    expect(screen.queryByTestId("work-overlay")).toBeNull();
  });

  it("bài đã đóng không có nút làm bài", () => {
    render(<MyAssignmentsPage />);
    expect(screen.getAllByRole("button", { name: "Làm bài ngay" })).toHaveLength(1);
    // "Đã đóng" vừa là nhãn tab (bấm được) vừa là nút bị khoá trên thẻ bài đã đóng.
    const closed = screen.getAllByRole("button", { name: "Đã đóng" }) as HTMLButtonElement[];
    expect(closed.some((b) => b.disabled)).toBe(true);
  });

  it("có lối vào 'Điểm của tôi'", () => {
    render(<MyAssignmentsPage />);
    expect(screen.getByRole("link", { name: /Điểm của tôi/ }).getAttribute("href")).toBe("/my-grades");
  });
});
