/**
 * QA2 Q2-03: giảng viên không nhân bản được bài trắc nghiệm. Backend nhân bản quiz + câu hỏi nhưng KHÔNG tạo
 * hàng lesson_content, nên nếu chỉ gọi /duplicate thì bản sao mồ côi, không hiện trong bài học. Nút phải:
 * nhân bản -> tạo content type 'quiz' trỏ tới bản sao -> làm mới danh sách; content lỗi thì xoá bản sao.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { toast } from "sonner";
import { QuizDuplicateButton } from "./quiz-duplicate-button";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

beforeEach(() => {
  resetMockApi();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

function mockDuplicateOk() {
  mockApi.post.mockImplementation((url: string) => {
    if (url === "/quizzes/q1/duplicate") return Promise.resolve(envelope({ id: "q2", title: "Kiểm tra Git (Copy)" }));
    if (url === "/lessons/les-1/contents") return Promise.resolve(envelope({ id: "ct-2", type: "quiz" }));
    return Promise.reject(new Error(`unexpected POST ${url}`));
  });
}

describe("QuizDuplicateButton", () => {
  it("nhân bản quiz rồi tạo content 'quiz' trỏ tới bản sao và làm mới danh sách nội dung", async () => {
    mockDuplicateOk();
    const { queryClient } = renderWithProviders(<QuizDuplicateButton lessonId="les-1" quizId="q1" />);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    fireEvent.click(screen.getByRole("button", { name: "Nhân bản bài trắc nghiệm" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Đã nhân bản bài trắc nghiệm"));
    expect(mockApi.post).toHaveBeenNthCalledWith(1, "/quizzes/q1/duplicate");
    expect(mockApi.post).toHaveBeenNthCalledWith(2, "/lessons/les-1/contents", {
      type: "quiz",
      title: "Kiểm tra Git (Copy)",
      quiz_id: "q2",
      is_mandatory: true,
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["lesson-content", "contents", "les-1"] });
  });

  // Review QA2 #8: bản sao luôn bị ép is_mandatory:true dù nội dung gốc là tuỳ chọn.
  it("bản sao giữ is_mandatory của nội dung gốc (tuỳ chọn -> vẫn tuỳ chọn)", async () => {
    mockDuplicateOk();
    renderWithProviders(<QuizDuplicateButton lessonId="les-1" quizId="q1" isMandatory={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Nhân bản bài trắc nghiệm" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(mockApi.post).toHaveBeenNthCalledWith(2, "/lessons/les-1/contents", expect.objectContaining({ is_mandatory: false }));
  });

  it("tạo content thất bại: xoá bản sao vừa tạo (không để quiz mồ côi) và báo lỗi, không báo thành công", async () => {
    mockApi.post.mockImplementation((url: string) =>
      url === "/quizzes/q1/duplicate"
        ? Promise.resolve(envelope({ id: "q2", title: "Kiểm tra Git (Copy)" }))
        : Promise.reject(new Error("boom")),
    );
    mockApi.delete.mockResolvedValue({ data: { message: "ok" } });
    renderWithProviders(<QuizDuplicateButton lessonId="les-1" quizId="q1" />);

    fireEvent.click(screen.getByRole("button", { name: "Nhân bản bài trắc nghiệm" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(mockApi.delete).toHaveBeenCalledWith("/quizzes/q2");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("nhân bản thất bại: báo lỗi, không tạo content", async () => {
    mockApi.post.mockRejectedValue(new Error("boom"));
    renderWithProviders(<QuizDuplicateButton lessonId="les-1" quizId="q1" />);

    fireEvent.click(screen.getByRole("button", { name: "Nhân bản bài trắc nghiệm" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(mockApi.post).toHaveBeenCalledTimes(1);
    expect(mockApi.delete).not.toHaveBeenCalled();
  });

  it("đang xử lý thì khoá nút: bấm hai lần chỉ nhân bản một lần", async () => {
    mockDuplicateOk();
    renderWithProviders(<QuizDuplicateButton lessonId="les-1" quizId="q1" />);
    const btn = screen.getByRole("button", { name: "Nhân bản bài trắc nghiệm" });

    fireEvent.click(btn);
    fireEvent.click(btn);

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(mockApi.post.mock.calls.filter((c) => c[0] === "/quizzes/q1/duplicate")).toHaveLength(1);
  });
});
