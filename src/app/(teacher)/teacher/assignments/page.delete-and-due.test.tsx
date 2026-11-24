/**
 * Q4-T01: "Xoá" phải hỏi lại trước khi gửi DELETE.
 * Q4-T08: hạn nộp đã qua thì không tạo, không công bố được.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteMutate = vi.fn();
const publishMutate = vi.fn();
const createMutate = vi.fn();
const toastError = vi.fn();

const PAST = "2020-01-01T00:00:00Z";
const assignments = [
  { id: "a1", title: "Bài QA4", type: "homework", is_published: false, end_time: PAST, description: "" },
];

vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a), success: vi.fn() } }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@/stores/auth.store", () => ({ useAuthStore: () => ({ user: { id: "t1" } }) }));
vi.mock("@/hooks/queries/use-courses", () => ({
  useMyCourses: () => ({ data: [{ id: "c1", title: "Khoá 1", status: "published", isPublished: true }], isLoading: false }),
}));
vi.mock("@/hooks/queries/use-livestream-v2", () => ({
  useTeacherLivestreamsForCourse: () => ({ data: [{ id: "s1", title: "Buổi 1", status: "scheduled" }], isLoading: false }),
}));
vi.mock("@/hooks/queries/use-assignments", () => ({
  useAssignmentsBySession: (id: string) => ({ data: id ? { data: assignments } : undefined, isLoading: false, isError: false }),
  useCreateAssignment: () => ({ mutate: createMutate, isPending: false }),
  usePublishAssignment: () => ({ mutate: publishMutate, isPending: false }),
  useUnpublishAssignment: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteAssignment: () => ({ mutate: deleteMutate, isPending: false }),
}));
vi.mock("@/components/editor", () => ({ TiptapEditor: () => null }));

// eslint-disable-next-line import/first
import TeacherAssignmentsPage from "./page";

function openSession() {
  render(<TeacherAssignmentsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Buổi 1/ }));
}

describe("/teacher/assignments — xoá và hạn nộp", () => {
  beforeEach(() => {
    deleteMutate.mockReset();
    publishMutate.mockReset();
    createMutate.mockReset();
    toastError.mockReset();
  });

  it("bấm Xoá chỉ mở hộp thoại xác nhận, chưa gửi DELETE", () => {
    openSession();
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }));
    expect(deleteMutate).not.toHaveBeenCalled();
    expect(screen.getByText("Xoá bài tập?")).toBeTruthy();
  });

  it("xác nhận trong hộp thoại mới gửi DELETE", () => {
    openSession();
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }));
    fireEvent.click(screen.getByRole("button", { name: "Xoá bài tập" }));
    expect(deleteMutate).toHaveBeenCalledWith({ id: "a1", sessionId: "s1" }, expect.anything());
  });

  it("huỷ trong hộp thoại thì không xoá", () => {
    openSession();
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }));
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }));
    expect(deleteMutate).not.toHaveBeenCalled();
  });

  it("hạn nộp đã qua: báo lỗi tại ô và khoá nút tạo", () => {
    openSession();
    fireEvent.change(screen.getByLabelText("Hạn nộp"), { target: { value: "2020-01-01T10:00" } });
    expect(screen.getByRole("alert").textContent).toContain("Hạn nộp phải ở tương lai.");
    expect((screen.getByRole("button", { name: /Tạo bài tập cho buổi học này/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("công bố bài đã quá hạn: không gọi API, báo lỗi", () => {
    openSession();
    fireEvent.click(screen.getByRole("button", { name: "Công bố" }));
    expect(publishMutate).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining("Hạn nộp phải ở tương lai."));
  });
});
