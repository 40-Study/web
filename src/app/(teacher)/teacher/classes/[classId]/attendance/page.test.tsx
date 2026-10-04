/**
 * QA B-18: lớp không tồn tại / của giảng viên khác (API 404) trước đây hiện trang điểm danh rỗng như lớp chưa có
 * buổi. Phải báo rõ; lỗi khác (mạng, 500) KHÔNG bị nhầm thành "không tìm thấy".
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";

const state = vi.hoisted(() => ({ sessions: {} as Record<string, unknown> }));

vi.mock("next/navigation", () => ({ useParams: () => ({ classId: "class-1" }) }));
vi.mock("@/hooks/queries/use-classes", () => ({ useClassStudentsByClassId: () => ({ data: [], isLoading: false }) }));
vi.mock("@/hooks/queries/use-sessions", () => ({
  useClassSessions: () => state.sessions,
  useSessionAttendances: () => ({ data: [], isLoading: false }),
  useBulkMarkAttendance: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateAttendance: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/components/attendance/use-attendance-draft", () => ({
  useAttendanceDraft: () => ({
    rows: [],
    setStatus: vi.fn(),
    setNote: vi.fn(),
    markAllPresent: vi.fn(),
    reset: vi.fn(),
    changes: { toCreate: [], toUpdate: [] },
    hasChanges: false,
  }),
}));
vi.mock("@/components/attendance/attendance-table", () => ({ AttendanceTable: () => <div>BANG DIEM DANH</div> }));

import ClassAttendancePage from "./page";

beforeEach(() => {
  state.sessions = {};
});

describe("ClassAttendancePage — lớp không xem được", () => {
  it("API 404: hiện 'Không tìm thấy lớp học', không hiện trang điểm danh rỗng", () => {
    state.sessions = { data: undefined, isLoading: false, isError: true, error: new ApiError(404, "ERR_NOT_FOUND", "class not found") };
    render(<ClassAttendancePage />);

    expect(screen.getByRole("heading", { name: "Không tìm thấy lớp học" })).toBeTruthy();
    expect(screen.queryByText(/chưa có buổi học nào/)).toBeNull();
  });

  it("API 403: hiện 'Không có quyền truy cập'", () => {
    state.sessions = { data: undefined, isLoading: false, isError: true, error: new ApiError(403, "ERR_FORBIDDEN", "forbidden") };
    render(<ClassAttendancePage />);

    expect(screen.getByRole("heading", { name: "Không có quyền truy cập" })).toBeTruthy();
  });

  it("lỗi khác (500): không nhầm thành 'không tìm thấy lớp'", () => {
    state.sessions = { data: undefined, isLoading: false, isError: true, error: new ApiError(500, "ERR", "boom") };
    render(<ClassAttendancePage />);

    expect(screen.queryByRole("heading", { name: "Không tìm thấy lớp học" })).toBeNull();
  });
});