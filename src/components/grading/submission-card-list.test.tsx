/** Q4-T18: ở 390px mỗi bài nộp là một thẻ có đủ thời gian nộp, điểm và nút xem/chấm (không cuộn ngang). */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GradingRow } from "@/lib/submission-grading";
import { SubmissionCardList } from "./submission-card-list";

const graded = {
  studentId: "u1",
  studentName: "Lê Văn C",
  status: "graded",
  late: true,
  attempts: 2,
  submission: { created_at: "2026-11-20T03:00:00Z" },
  grade: { score: 8, max_score: 10, graded_by_name: "Cô Lan" },
} as unknown as GradingRow;
const ungraded = {
  ...graded,
  studentId: "u2",
  studentName: "Bé Hoa",
  status: "ungraded",
  late: false,
  attempts: 1,
  grade: undefined,
} as unknown as GradingRow;

describe("SubmissionCardList", () => {
  it("hiện thời gian nộp, điểm, người chấm và nhãn trạng thái", () => {
    render(<SubmissionCardList rows={[graded]} canGrade onOpen={vi.fn()} />);
    expect(screen.getByText("Thời gian nộp")).toBeTruthy();
    expect(screen.getByText("8/10")).toBeTruthy();
    expect(screen.getByText("Chấm bởi Cô Lan")).toBeTruthy();
    expect(screen.getByText("Nộp muộn")).toBeTruthy();
    expect(screen.getByText("2 lần nộp")).toBeTruthy();
  });

  it("nút Xem bài / Chấm điểm mở đúng học viên; bài đã chấm không có nút Chấm điểm", () => {
    const onOpen = vi.fn();
    render(<SubmissionCardList rows={[graded, ungraded]} canGrade onOpen={onOpen} />);
    expect(screen.getAllByRole("button", { name: /Chấm điểm/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Chấm điểm/ }));
    expect(onOpen).toHaveBeenCalledWith("u2");
    fireEvent.click(screen.getAllByRole("button", { name: /Xem bài/ })[0]);
    expect(onOpen).toHaveBeenLastCalledWith("u1");
  });

  it("không chấm được (lớp lưu trữ/chưa gắn lớp): không có nút Chấm điểm", () => {
    render(<SubmissionCardList rows={[ungraded]} canGrade={false} onOpen={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Chấm điểm/ })).toBeNull();
  });
});
