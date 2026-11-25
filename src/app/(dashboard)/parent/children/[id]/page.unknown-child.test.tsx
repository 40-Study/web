/**
 * PG-L2 (QA2 261013): mở /parent/children/<id lạ> hiện "Không tìm thấy thông tin học sinh" nhưng đã bắn 6 request 403
 * (overview + courses/grades/timetable/attendance/assignments) vì mọi query chạy song song, không đợi overview xác nhận
 * con có thuộc phụ huynh này. Test đi qua hook + service THẬT (chỉ giả lập tầng HTTP) để đếm đúng số request.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, ForbiddenError } from "@/lib/errors";
import { renderWithProviders } from "@/test/utils";

const svc = vi.hoisted(() => ({
  getChildOverview: vi.fn(),
  getChildCourses: vi.fn(),
  getChildGrades: vi.fn(),
  getChildTimetable: vi.fn(),
  getChildAttendance: vi.fn(),
  getChildAssignments: vi.fn(),
}));

vi.mock("@/services/parent-dashboard.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/parent-dashboard.service")>()),
  parentDashboardService: svc,
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "child-x" }),
  useRouter: () => ({ back: vi.fn() }),
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { src: string; alt: string }) => <img src={props.src} alt={props.alt} />,
}));
vi.mock("@/components/parent/child-overview-tab", () => ({ ChildOverviewTab: () => null }));
vi.mock("@/components/parent/child-courses-tab", () => ({ ChildCoursesTab: () => null }));

import ChildDetailPage from "./page";

const OTHER_QUERIES = [
  "getChildCourses",
  "getChildGrades",
  "getChildTimetable",
  "getChildAttendance",
  "getChildAssignments",
] as const;

beforeEach(() => {
  Object.values(svc).forEach((fn) => fn.mockReset().mockResolvedValue({}));
});

describe("ChildDetailPage — id học sinh không thuộc phụ huynh", () => {
  it("chỉ hỏi overview (1 request), hiện 'Không tìm thấy', không bắn các query còn lại", async () => {
    svc.getChildOverview.mockRejectedValue(new ForbiddenError());
    renderWithProviders(<ChildDetailPage />);

    expect(await screen.findByText("Không tìm thấy thông tin học sinh")).toBeTruthy();
    // Q6-PG-08: trang không tìm thấy từng không có h1 nào.
    expect(screen.getByRole("heading", { level: 1, name: "Không tìm thấy thông tin học sinh" })).toBeTruthy();
    expect(svc.getChildOverview).toHaveBeenCalledTimes(1);
    for (const name of OTHER_QUERIES) expect(svc[name], name).not.toHaveBeenCalled();
  });

  // Q7-PG-03 (C17): 400 ERR_INVALID_ID / 403 ERR_CHILD_NOT_LINKED là "không tìm thấy"; 500 là sự cố tạm có "Thử lại".
  it.each([
    [400, "ERR_INVALID_ID"],
    [403, "ERR_CHILD_NOT_LINKED"],
    [404, "ERR_NOT_FOUND"],
  ])("overview %i %s: 'Không tìm thấy thông tin học sinh', không có 'Thử lại'", async (status, code) => {
    svc.getChildOverview.mockRejectedValue(new ApiError(status, code, "x"));
    renderWithProviders(<ChildDetailPage />);
    expect(await screen.findByText("Không tìm thấy thông tin học sinh")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
  });

  it("overview 500 ERR_INTERNAL: trạng thái lỗi tải kèm 'Thử lại', KHÔNG nói không tìm thấy; thử lại tải lại overview", async () => {
    svc.getChildOverview.mockRejectedValue(new ApiError(500, "ERR_INTERNAL", "Đã có lỗi xảy ra, vui lòng thử lại"));
    renderWithProviders(<ChildDetailPage />);
    expect(await screen.findByRole("heading", { level: 1, name: "Không tải được thông tin học sinh" }, { timeout: 8000 })).toBeTruthy();
    expect(screen.queryByText("Không tìm thấy thông tin học sinh")).toBeNull();

    const calls = svc.getChildOverview.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() => expect(svc.getChildOverview.mock.calls.length).toBeGreaterThan(calls));
  });

  it("id hợp lệ: tải dữ liệu cần cho overview; lịch và điểm chỉ tải khi mở tab", async () => {
    svc.getChildOverview.mockResolvedValue({
      id: "child-x", username: "be_an", full_name: "Bé An", relationship: "parent", total_xp: 1, current_streak: 1,
      enrolled_courses: 0, completed_courses: 0, total_study_minutes: 0,
      can_view_progress: true, can_view_grades: true, can_view_attendance: true,
    });
    renderWithProviders(<ChildDetailPage />);

    await screen.findByRole("heading", { name: "Bé An" });
    for (const name of ["getChildCourses", "getChildAttendance", "getChildAssignments"] as const) await waitFor(() => expect(svc[name], name).toHaveBeenCalledTimes(1));
    expect(svc.getChildGrades).not.toHaveBeenCalled();
    expect(svc.getChildTimetable).not.toHaveBeenCalled();
    svc.getChildTimetable.mockResolvedValue({ entries: [] });
    // Q7-PG-07: bốn thẻ thống kê hiện ở các tab khác nhưng ẩn ở tab Lịch học để lịch lên trên màn hình đầu.
    expect(screen.getByText("Chuỗi ngày học")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Lịch học" }));
    expect(screen.queryByText("Chuỗi ngày học")).toBeNull();
    await waitFor(() => expect(svc.getChildTimetable).toHaveBeenCalledTimes(1));
    // Q6-PG-08: tên con là h1 duy nhất; tiêu đề "Lịch học" của lịch là h2.
    await screen.findByRole("heading", { level: 2, name: "Lịch học" });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
