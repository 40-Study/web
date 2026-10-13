/**
 * Re-review PR #79: xoá khoá đang chờ duyệt -> backend 409 COURSE_PENDING_REVIEW. Trước đây toast
 * chỉ báo chung "Không thể xoá khoá học"; giờ phải nói rõ lý do bằng tiếng Việt.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ApiError } from "@/lib/errors";
import { courseService } from "@/services/course.service";
import { useDeleteCourse } from "./use-courses";

vi.mock("@/services/course.service", () => ({
  courseService: { deleteCourse: vi.fn(), updateCourse: vi.fn() },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useDeleteCourse — thông báo lỗi", () => {
  beforeEach(() => {
    vi.mocked(courseService.deleteCourse).mockReset();
    vi.mocked(courseService.updateCourse).mockReset();
    vi.mocked(toast.error).mockReset();
    vi.mocked(toast.success).mockReset();
  });

  it("409 COURSE_PENDING_REVIEW -> báo khoá đang chờ duyệt, không phải lỗi chung", async () => {
    vi.mocked(courseService.deleteCourse).mockRejectedValue(
      new ApiError(409, "COURSE_PENDING_REVIEW", "Course is pending review")
    );
    const { result } = renderHook(() => useDeleteCourse(), { wrapper });
    act(() => result.current.mutate("course-1"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(vi.mocked(toast.error).mock.calls[0][0]).toMatch(/đang chờ duyệt/);
  });

  it("lỗi không có mã riêng -> giữ câu chung", async () => {
    vi.mocked(courseService.deleteCourse).mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useDeleteCourse(), { wrapper });
    act(() => result.current.mutate("course-1"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Không thể xoá khoá học"));
  });

  // Smoke2 Q2-01b: khoá còn học viên -> 409 COURSE_HAS_ENROLLMENTS; toast chỉ khuyên "Lưu trữ" mà không có nút.
  describe("409 COURSE_HAS_ENROLLMENTS — gợi ý Lưu trữ", () => {
    function rejectWithEnrollments() {
      vi.mocked(courseService.deleteCourse).mockRejectedValue(
        new ApiError(409, "COURSE_HAS_ENROLLMENTS", "Course has active enrollments")
      );
    }
    async function deleteAndGetAction() {
      const { result } = renderHook(() => useDeleteCourse(), { wrapper });
      act(() => result.current.mutate("course-1"));
      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
      const [message, options] = vi.mocked(toast.error).mock.calls[0] as [string, { action?: { label: string; onClick: () => void } }?];
      return { message, action: options?.action };
    }

    it("toast nói rõ lý do bằng tiếng Việt và có nút 'Lưu trữ'", async () => {
      rejectWithEnrollments();
      const { message, action } = await deleteAndGetAction();
      expect(message).toMatch(/học viên/);
      expect(action?.label).toBe("Lưu trữ");
    });

    it("bấm 'Lưu trữ' -> PUT status archived rồi báo thành công", async () => {
      rejectWithEnrollments();
      vi.mocked(courseService.updateCourse).mockResolvedValue({} as never);
      const { action } = await deleteAndGetAction();
      action!.onClick();
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Đã lưu trữ khoá học"));
      expect(courseService.updateCourse).toHaveBeenCalledWith("course-1", { status: "archived" });
    });

    it("lưu trữ lỗi (vd. khoá chưa xuất bản) -> báo lỗi tiếng Việt, không báo thành công", async () => {
      rejectWithEnrollments();
      vi.mocked(courseService.updateCourse).mockRejectedValue(
        new ApiError(400, "COURSE_STATUS_CHANGE_NOT_ALLOWED", "course status cannot be changed directly")
      );
      const { action } = await deleteAndGetAction();
      action!.onClick();
      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(2));
      expect(vi.mocked(toast.error).mock.calls[1][0]).toMatch(/Không thể đổi trạng thái/);
      expect(toast.success).not.toHaveBeenCalled();
    });

    it("lỗi khác (COURSE_PENDING_REVIEW) -> không có nút Lưu trữ", async () => {
      vi.mocked(courseService.deleteCourse).mockRejectedValue(new ApiError(409, "COURSE_PENDING_REVIEW", "x"));
      const { action } = await deleteAndGetAction();
      expect(action).toBeUndefined();
    });
  });
});
