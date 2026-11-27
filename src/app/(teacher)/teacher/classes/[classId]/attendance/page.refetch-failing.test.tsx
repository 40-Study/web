/**
 * Q11-T-01: điểm danh refetch lỗi mà còn bản cũ trong cache: hàng và nút Lưu phải khoá NGAY khi lượt làm mới đã thất bại một lần
 * (`failureCount > 0`, react-query còn đang thử lại), không đợi hết các lần thử (~2 s) rồi mới khoá dưới tay giáo viên.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SESSION = { id: "s1", date: "2026-10-01", start_time: "19:00", end_time: "20:30", status: "completed" };
const state = vi.hoisted(() => ({
  sessions: {} as Record<string, unknown>,
  students: {} as Record<string, unknown>,
  attendances: {} as Record<string, unknown>,
}));

vi.mock("next/navigation", () => ({ useParams: () => ({ classId: "class-1" }) }));
vi.mock("@/hooks/queries/use-classes", () => ({ useClassStudentsByClassId: () => state.students }));
vi.mock("@/hooks/queries/use-class-manage", () => ({ useClassById: () => ({ data: { id: "class-1", status: "active" } }) }));
vi.mock("@/hooks/queries/use-sessions", () => ({
  useAllClassSessions: () => state.sessions,
  useSessionAttendances: () => state.attendances,
  useBulkMarkAttendance: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateAttendance: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/components/attendance/use-attendance-draft", () => ({
  useAttendanceDraft: () => ({
    rows: [{ studentId: "u1", name: "Bé Minh" }],
    setStatus: vi.fn(), setNote: vi.fn(), markAllPresent: vi.fn(), reset: vi.fn(),
    changes: { toCreate: [], toUpdate: [] }, hasChanges: true,
  }),
}));
vi.mock("@/components/attendance/attendance-table", () => ({ AttendanceTable: () => <div data-testid="table" /> }));
vi.mock("@/components/attendance/attendance-card-list", () => ({ AttendanceCardList: () => null }));

import ClassAttendancePage from "./page";

const refetchSessions = vi.fn();
const refetchStudents = vi.fn();
const refetchAttendances = vi.fn();

beforeEach(() => {
  [refetchSessions, refetchStudents, refetchAttendances].forEach((f) => f.mockReset().mockResolvedValue(undefined));
  state.sessions = { data: { sessions: [SESSION] }, isLoading: false, isError: false, refetch: refetchSessions };
  state.students = { data: [{ id: "u1" }], isLoading: false, isError: false, refetch: refetchStudents };
  state.attendances = { data: [], isLoading: false, isError: false, failureCount: 0, refetch: refetchAttendances };
});

const saveDisabled = () => (screen.getByRole("button", { name: "Lưu điểm danh" }) as HTMLButtonElement).disabled;
const markAllDisabled = () => (screen.getByRole("button", { name: "Đánh dấu tất cả có mặt" }) as HTMLButtonElement).disabled;

describe("ClassAttendancePage — Q11-T-01 khoá ngay khi lượt làm mới thất bại lần đầu", () => {
  it("đang thử lại (isError=false, failureCount=1) mà còn bản cũ: khoá Lưu + Đánh dấu tất cả và nói lý do", () => {
    state.attendances = { data: [], isLoading: false, isError: false, failureCount: 1, refetch: refetchAttendances };
    render(<ClassAttendancePage />);

    expect(saveDisabled()).toBe(true);
    expect(markAllDisabled()).toBe(true);
    expect(screen.getByRole("status").textContent).toContain("Tạm khoá lưu");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("chưa thất bại lần nào (failureCount=0): không khoá, không thông báo (đối chứng)", () => {
    render(<ClassAttendancePage />);
    expect(saveDisabled()).toBe(false);
    expect(markAllDisabled()).toBe(false);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("lần tải ĐẦU đang thử lại (chưa có bản cũ): không phải 'dữ liệu cũ', không có thông báo giả", () => {
    state.attendances = { data: undefined, isLoading: true, isError: false, failureCount: 2, refetch: refetchAttendances };
    render(<ClassAttendancePage />);
    expect(screen.queryByText(/Tạm khoá lưu/)).toBeNull();
  });

  it("hook cũ/mock không có failureCount: coi như 0, không khoá", () => {
    state.attendances = { data: [], isLoading: false, isError: false, refetch: refetchAttendances };
    render(<ClassAttendancePage />);
    expect(saveDisabled()).toBe(false);
  });
});
