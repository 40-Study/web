/**
 * Q10-T-01: GET /classes/{id}/sessions lỗi 5xx => trang hiện "Lớp này chưa có buổi học nào ... Tạo lịch học cho lớp" cho một lớp
 * CÓ buổi học; giáo viên đi tạo lịch trùng. Phải hiện lỗi + "Thử lại". Cùng lỗi với danh sách học viên / điểm danh (hiện bảng
 * rỗng, lưu điểm danh đè lên bản ghi chưa tải được).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";

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
  state.attendances = { data: [], isLoading: false, isError: false, refetch: refetchAttendances };
});

describe("ClassAttendancePage — Q10-T-01 lỗi tải không phải 'chưa có buổi'", () => {
  it("sessions 500: hộp lỗi + Thử lại, KHÔNG có 'chưa có buổi học' / 'Tạo lịch học cho lớp'", () => {
    state.sessions = { data: undefined, isLoading: false, isError: true, error: new ApiError(500, "ERR", "boom"), refetch: refetchSessions };
    render(<ClassAttendancePage />);

    expect(screen.getByRole("alert").textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/chưa có buổi học nào/)).toBeNull();
    expect(screen.queryByRole("link", { name: "Tạo lịch học cho lớp" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchSessions).toHaveBeenCalledTimes(1);
  });

  it("sessions refetch nền lỗi nhưng còn dữ liệu cũ: giữ trang, không phủ hộp lỗi", () => {
    state.sessions = { data: { sessions: [SESSION] }, isLoading: false, isError: true, error: new Error("net"), refetch: refetchSessions };
    render(<ClassAttendancePage />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("combobox")).toBeTruthy();
  });

  it("danh sách học viên lỗi: hộp lỗi thay bảng, khoá 'Lưu điểm danh', Thử lại gọi refetch học viên", () => {
    state.students = { data: undefined, isLoading: false, isError: true, error: new Error("boom"), refetch: refetchStudents };
    render(<ClassAttendancePage />);

    expect(screen.getByRole("alert").textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByTestId("table")).toBeNull();
    expect((screen.getByRole("button", { name: "Lưu điểm danh" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Đánh dấu tất cả có mặt" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchStudents).toHaveBeenCalledTimes(1);
    expect(refetchAttendances).not.toHaveBeenCalled();
  });

  it("điểm danh của buổi lỗi: hộp lỗi thay bảng, Thử lại gọi refetch điểm danh", () => {
    state.attendances = { data: undefined, isLoading: false, isError: true, error: new Error("boom"), refetch: refetchAttendances };
    render(<ClassAttendancePage />);

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.queryByTestId("table")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchAttendances).toHaveBeenCalledTimes(1);
  });

  it("đối chứng: mọi query ổn thì bảng hiện, nút Lưu bật, không có hộp lỗi", () => {
    render(<ClassAttendancePage />);
    expect(screen.getByTestId("table")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect((screen.getByRole("button", { name: "Lưu điểm danh" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
