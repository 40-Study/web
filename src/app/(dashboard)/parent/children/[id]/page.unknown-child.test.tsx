/**
 * PG-L2 (QA2 261013): mở /parent/children/<id lạ> hiện "Không tìm thấy thông tin học sinh" nhưng đã bắn 6 request 403
 * (overview + courses/grades/timetable/attendance/assignments) vì mọi query chạy song song, không đợi overview xác nhận
 * con có thuộc phụ huynh này. Test đi qua hook + service THẬT (chỉ giả lập tầng HTTP) để đếm đúng số request.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/errors";
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
    expect(svc.getChildOverview).toHaveBeenCalledTimes(1);
    for (const name of OTHER_QUERIES) expect(svc[name], name).not.toHaveBeenCalled();
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
    fireEvent.click(screen.getByRole("tab", { name: "Lịch học" }));
    await waitFor(() => expect(svc.getChildTimetable).toHaveBeenCalledTimes(1));
  });
});
