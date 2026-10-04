/**
 * B-06 (QA hồi quy 03/10/2026): giảng viên không có chỗ nào trên web để chấm điểm; "Xem bài" là nút chết;
 * "Đã chấm" suy từ verdict của máy chạy test thay vì dữ liệu chấm thật; không thấy ai chấm.
 */

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Grade } from "@/services/grade.service";
import type { SubmissionResponseDTO } from "@/services/submission.service";

let mockAssignment: Record<string, unknown> | undefined;
let mockAssignmentError: unknown = null;
let mockSubmissions: SubmissionResponseDTO[] = [];
let mockSubmissionsError: unknown = null;
let mockGrades: Grade[] = [];
const createGrade = vi.fn();
const updateGrade = vi.fn();

vi.mock("@/hooks/queries/use-assignments", () => ({
  useAssignment: () => ({ data: mockAssignment, isLoading: false, error: mockAssignmentError }),
}));
vi.mock("@/hooks/queries/use-submissions", () => ({
  useSubmissionsByAssignment: () => ({
    data: mockSubmissionsError ? undefined : { data: mockSubmissions, total: mockSubmissions.length, page: 1, page_size: 100 },
    isLoading: false,
    error: mockSubmissionsError,
  }),
}));
vi.mock("@/hooks/queries/use-grades", () => ({
  useGradeBook: () => ({
    data: {
      class_id: "class-1",
      columns: [],
      students: mockGrades.length
        ? [{ student_id: "u1", student_name: "Lê Văn C", grades: mockGrades }]
        : null,
    },
    isLoading: false,
    error: null,
  }),
  useCreateGrade: () => ({ mutateAsync: createGrade, isPending: false }),
  useUpdateGrade: () => ({ mutateAsync: updateGrade, isPending: false }),
}));

// eslint-disable-next-line import/first
import { SubmissionGradingPanel } from "./submission-grading-panel";

function sub(over: Partial<SubmissionResponseDTO> = {}): SubmissionResponseDTO {
  return {
    id: "s1",
    assignment_id: "a1",
    user_id: "u1",
    user: { id: "u1", username: "student1" },
    language: "javascript",
    code: "function cartTotal(items) { return 0; }",
    verdict: "wrong_answer",
    score: 33,
    execution_time: 1,
    memory_used: 1,
    test_cases_passed: 1,
    total_test_cases: 3,
    created_at: "2026-09-19T20:59:00+07:00",
    ...over,
  };
}

function grade(over: Partial<Grade> = {}): Grade {
  return {
    id: "g1",
    class_id: "class-1",
    student_id: "u1",
    student_name: "Lê Văn C",
    assignment_id: "a1",
    grade_type: "assignment",
    title: "Bài tập: Tính tổng giỏ hàng",
    score: 9,
    max_score: 10,
    feedback: "Tốt",
    graded_by: "t1",
    graded_by_name: "Nguyễn Văn A",
    graded_at: "2026-09-22T23:59:00+07:00",
    ...over,
  };
}

beforeEach(() => {
  createGrade.mockReset().mockResolvedValue({});
  updateGrade.mockReset().mockResolvedValue({});
  mockAssignmentError = null;
  mockSubmissionsError = null;
  mockGrades = [];
  mockSubmissions = [sub()];
  mockAssignment = {
    id: "a1",
    class_id: "class-1",
    type: "homework",
    title: "Tính tổng giỏ hàng",
    end_time: "2026-09-21T14:00:00Z",
    allow_late_submission: false,
    grace_period_minutes: 15,
  };
});

describe("SubmissionGradingPanel", () => {
  it("bài nộp 'accepted' chưa có điểm hiện CHƯA CHẤM, không suy từ verdict", () => {
    mockSubmissions = [sub({ verdict: "accepted", test_cases_passed: 3 })];
    render(<SubmissionGradingPanel assignmentId="a1" />);

    const row = screen.getByText("student1").closest("tr")!;
    expect(within(row).getByText("Chưa chấm")).toBeTruthy();
    expect(within(row).queryByText("Đã chấm")).toBeNull();
  });

  it("bài đã có điểm hiện Đã chấm, điểm và người chấm", () => {
    mockGrades = [grade()];
    render(<SubmissionGradingPanel assignmentId="a1" />);

    const row = screen.getByText("Lê Văn C").closest("tr")!;
    expect(within(row).getByText("Đã chấm")).toBeTruthy();
    expect(within(row).getByText("9/10")).toBeTruthy();
    expect(within(row).getByText(/Chấm bởi Nguyễn Văn A/)).toBeTruthy();
  });

  it("'Xem bài' mở hộp thoại có bài làm của học viên", () => {
    render(<SubmissionGradingPanel assignmentId="a1" />);

    fireEvent.click(screen.getByRole("button", { name: /Xem bài/ }));

    expect(screen.getByTestId("submission-code").textContent).toContain("function cartTotal");
  });

  it("chấm bài mới: gửi điểm (nhận dấu phẩy), nhận xét, gắn bài tập và đóng hộp thoại", async () => {
    render(<SubmissionGradingPanel assignmentId="a1" />);

    fireEvent.click(screen.getByRole("button", { name: /Chấm điểm/ }));
    fireEvent.change(screen.getByLabelText(/Điểm \(thang 10\)/), { target: { value: "8,5" } });
    fireEvent.change(screen.getByLabelText(/Nhận xét/), { target: { value: "Cần thêm test" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu điểm" }));

    await waitFor(() => expect(createGrade).toHaveBeenCalledTimes(1));
    expect(createGrade).toHaveBeenCalledWith({
      student_id: "u1",
      grade_type: "assignment",
      title: "Bài tập: Tính tổng giỏ hàng",
      score: 8.5,
      max_score: 10,
      assignment_id: "a1",
      feedback: "Cần thêm test",
    });
    expect(updateGrade).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByTestId("submission-code")).toBeNull());
  });

  it("sửa điểm đã chấm: gọi cập nhật đúng bản ghi, không tạo bản ghi thứ hai", async () => {
    mockGrades = [grade()];
    render(<SubmissionGradingPanel assignmentId="a1" />);

    fireEvent.click(screen.getByRole("button", { name: /Xem bài/ }));
    fireEvent.change(screen.getByLabelText(/Điểm \(thang 10\)/), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu điểm" }));

    await waitFor(() => expect(updateGrade).toHaveBeenCalledTimes(1));
    expect(updateGrade).toHaveBeenCalledWith({ gradeId: "g1", data: { score: 10, feedback: "Tốt" } });
    expect(createGrade).not.toHaveBeenCalled();
  });

  it("sửa bản ghi điểm thang 100: nhập 85 được và chặn theo max_score của bản ghi (review R4 MINOR 5)", async () => {
    mockGrades = [grade({ score: 70, max_score: 100 })];
    render(<SubmissionGradingPanel assignmentId="a1" />);

    fireEvent.click(screen.getByRole("button", { name: /Xem bài/ }));
    fireEvent.change(screen.getByLabelText(/Điểm \(thang 100\)/), { target: { value: "101" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu điểm" }));
    expect(await screen.findByText("Điểm phải từ 0 đến 100")).toBeTruthy();
    expect(updateGrade).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Điểm \(thang 100\)/), { target: { value: "85" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu điểm" }));
    await waitFor(() => expect(updateGrade).toHaveBeenCalledTimes(1));
    expect(updateGrade).toHaveBeenCalledWith({ gradeId: "g1", data: { score: 85, feedback: "Tốt" } });
  });

  it("điểm ngoài thang hoặc để trống: báo lỗi tại ô, không gọi API", async () => {
    render(<SubmissionGradingPanel assignmentId="a1" />);

    fireEvent.click(screen.getByRole("button", { name: /Chấm điểm/ }));
    fireEvent.click(screen.getByRole("button", { name: "Lưu điểm" }));
    expect(await screen.findByText("Nhập điểm")).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/Điểm \(thang 10\)/), { target: { value: "11" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu điểm" }));
    expect(await screen.findByText("Điểm phải từ 0 đến 10")).toBeTruthy();
    expect(createGrade).not.toHaveBeenCalled();
  });

  it("lưu lỗi thì giữ hộp thoại mở để không mất nội dung đã nhập", async () => {
    createGrade.mockRejectedValue(new Error("403"));
    render(<SubmissionGradingPanel assignmentId="a1" />);

    fireEvent.click(screen.getByRole("button", { name: /Chấm điểm/ }));
    fireEvent.change(screen.getByLabelText(/Điểm \(thang 10\)/), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu điểm" }));

    await waitFor(() => expect(createGrade).toHaveBeenCalled());
    expect(screen.getByTestId("submission-code")).toBeTruthy();
  });

  it("bài tập chưa gắn lớp: xem được bài nhưng không có nút chấm/lưu", () => {
    mockAssignment = { ...mockAssignment, class_id: undefined };
    render(<SubmissionGradingPanel assignmentId="a1" />);

    expect(screen.queryByRole("button", { name: /Chấm điểm/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Xem bài/ }));
    expect(screen.getByTestId("submission-code")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Lưu điểm" })).toBeNull();
  });

  it("bài tập dạng project lưu điểm với grade_type project", async () => {
    mockAssignment = { ...mockAssignment, type: "project" };
    render(<SubmissionGradingPanel assignmentId="a1" />);

    fireEvent.click(screen.getByRole("button", { name: /Chấm điểm/ }));
    fireEvent.change(screen.getByLabelText(/Điểm \(thang 10\)/), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu điểm" }));

    await waitFor(() => expect(createGrade).toHaveBeenCalledTimes(1));
    expect(createGrade.mock.calls[0][0].grade_type).toBe("project");
  });

  it("không có quyền xem bài nộp (403): hiện thông báo rõ ràng thay vì bảng rỗng", () => {
    mockSubmissionsError = Object.assign(new Error("forbidden"), { status: 403 });
    render(<SubmissionGradingPanel assignmentId="a1" />);

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("chưa ai nộp bài: nói rõ thay vì 'không tìm thấy học viên'", () => {
    mockSubmissions = [];
    render(<SubmissionGradingPanel assignmentId="a1" />);

    expect(screen.getByText("Chưa có học viên nào nộp bài")).toBeTruthy();
  });
});
