/**
 * QA B-18: lớp không tồn tại / của giảng viên khác (API 404) trước đây hiện trang điểm danh rỗng như lớp chưa có
 * buổi. Phải báo rõ; lỗi khác (mạng, 500) KHÔNG bị nhầm thành "không tìm thấy".
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";

const state = vi.hoisted(() => ({ sessions: {} as Record<string, unknown>, classStatus: undefined as string | undefined }));

vi.mock("next/navigation", () => ({ useParams: () => ({ classId: "class-1" }) }));
vi.mock("@/hooks/queries/use-classes", () => ({ useClassStudentsByClassId: () => ({ data: [], isLoading: false }) }));
vi.mock("@/hooks/queries/use-class-manage", () => ({
  useClassById: () => ({ data: state.classStatus ? { id: "class-1", status: state.classStatus } : undefined }),
}));
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
vi.mock("@/components/attendance/attendance-table", () => ({ AttendanceTable: ({ disabled }: { disabled?: boolean }) => <div data-testid="table" data-disabled={String(!!disabled)}>BANG DIEM DANH</div> }));

import ClassAttendancePage from "./page";

beforeEach(() => {
  state.sessions = {};
  state.classStatus = "active";
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
describe("ClassAttendancePage — lớp đã lưu trữ (chỉ đọc)", () => {
  const withSession = () => {
    state.sessions = {
      data: { sessions: [{ id: "s1", date: "2026-10-01", start_time: "19:00", end_time: "20:30", status: "completed" }] },
      isLoading: false,
    };
  };

  it("lớp lưu trữ: thông báo chỉ đọc, khoá 'Đánh dấu tất cả có mặt' và 'Lưu điểm danh', bảng ở chế độ khoá", () => {
    state.classStatus = "archived";
    withSession();
    render(<ClassAttendancePage />);

    expect(screen.getByText(/Lớp đã lưu trữ: chỉ xem điểm danh/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Đánh dấu tất cả có mặt" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Lưu điểm danh" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId("table").getAttribute("data-disabled")).toBe("true");
  });

  it("lớp đang hoạt động: không có thông báo lưu trữ, bảng không bị khoá", () => {
    withSession();
    render(<ClassAttendancePage />);

    expect(screen.queryByText(/Lớp đã lưu trữ/)).toBeNull();
    expect(screen.getByTestId("table").getAttribute("data-disabled")).toBe("false");
  });
});
