/**
 * Q3-22: nút quay lại của trang quản lý lớp luôn nói "Khoá học của tôi" kể cả khi vào từ "Lớp học". Mặc định phải
 * về danh sách lớp; chỉ khi mở từ trang khoá học (?from=course) mới về khoá học. ?tab=schedule mở tab Lịch học.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ search: "", courseId: undefined as string | undefined, panelTab: "", noClass: false }));

vi.mock("next/navigation", () => ({
  useParams: () => ({ classId: "class-1" }),
  useSearchParams: () => new URLSearchParams(state.search),
}));
vi.mock("@/hooks/queries/use-class-manage", () => ({
  useClassById: () => ({ data: state.noClass ? undefined : { id: "class-1", course_id: state.courseId } }),
}));
vi.mock("@/components/classes/class-manage-panel", () => ({
  ClassManagePanel: ({ initialTab }: { initialTab?: string }) => <div data-testid="panel" data-tab={initialTab} />,
}));
vi.mock("@/components/classes/class-assignments-list", () => ({
  ClassAssignmentsList: ({ hrefFor, emptyTitle }: { hrefFor: (id: string) => string; emptyTitle?: string }) => (
    <a data-testid="assignments" href={hrefFor("a-1")} data-empty={emptyTitle}>
      bài tập
    </a>
  ),
}));

import TeacherClassManagePage from "./page";

beforeEach(() => {
  state.search = "";
  state.courseId = "course-9";
  state.noClass = false;
});

describe("TeacherClassManagePage", () => {
  it("mặc định quay lại 'Lớp học của tôi' (/teacher/classes), không phải khoá học", () => {
    render(<TeacherClassManagePage />);
    const back = screen.getByRole("link", { name: /Lớp học của tôi/ });
    expect(back.getAttribute("href")).toBe("/teacher/classes");
    expect(screen.queryByText(/Khoá học của tôi/)).toBeNull();
    expect(screen.getByTestId("panel").getAttribute("data-tab")).toBe("members");
  });

  it("mở từ trang khoá học (?from=course): quay về khoá học của lớp", () => {
    state.search = "from=course";
    render(<TeacherClassManagePage />);
    expect(screen.getByRole("link", { name: /Khoá học của lớp/ }).getAttribute("href")).toBe("/teacher/courses/course-9");
  });

  it("?from=course nhưng lớp không gắn khoá: vẫn về danh sách lớp", () => {
    state.search = "from=course";
    state.courseId = undefined;
    render(<TeacherClassManagePage />);
    expect(screen.getByRole("link", { name: /Lớp học của tôi/ }).getAttribute("href")).toBe("/teacher/classes");
  });

  // QA-B-08: trang lớp từng không có lối vào bài tập/bài nộp của lớp.
  it("có danh sách bài tập của lớp, mỗi bài dẫn tới trang bài nộp", () => {
    render(<TeacherClassManagePage />);
    expect(screen.getByTestId("assignments").getAttribute("href")).toBe("/teacher/assignments/a-1/submissions");
    // Câu báo rỗng viết cho giảng viên, không dùng câu mặc định của khu tổ chức.
    expect(screen.getByTestId("assignments").getAttribute("data-empty")).toBe("Chưa có bài tập nào cho lớp này.");
  });

  it("?tab=schedule mở thẳng tab Lịch học", () => {
    state.search = "tab=schedule";
    render(<TeacherClassManagePage />);
    expect(screen.getByTestId("panel").getAttribute("data-tab")).toBe("schedule");
  });
});

// Q6-T07: lớp không tồn tại chỉ có thẻ "Không tìm thấy lớp" (từ ClassManagePanel), không kèm nút Điểm danh sống tới
// /teacher/classes/<id lạ>/attendance hay danh sách bài tập của lớp đó.
describe("TeacherClassManagePage: lớp chưa tải được (Q6-T07)", () => {
  it("không có dữ liệu lớp -> không có link Điểm danh và không có danh sách bài tập, vẫn có nút quay lại", () => {
    state.noClass = true;
    render(<TeacherClassManagePage />);
    expect(screen.queryByRole("link", { name: /Điểm danh/ })).toBeNull();
    expect(screen.queryByTestId("assignments")).toBeNull();
    expect(screen.getByRole("link", { name: /Lớp học của tôi/ })).toBeTruthy();
  });

  it("có dữ liệu lớp -> link Điểm danh trỏ tới đúng lớp", () => {
    render(<TeacherClassManagePage />);
    expect(screen.getByRole("link", { name: /Điểm danh/ }).getAttribute("href")).toBe("/teacher/classes/class-1/attendance");
  });
});
