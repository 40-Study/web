/**
 * QA7: Q7-T05 (tạo khoá không tự toast thành công: trang đã toast) và Q7-T10 (xoá khoá không làm trang chi tiết
 * còn mount refetch chính khoá vừa xoá).
 */

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { courseService } from "@/services/course.service";
import { courseKeys, useCreateCourse, useDeleteCourse } from "./use-courses";

vi.mock("@/services/course.service", () => ({
  courseService: { createCourse: vi.fn(), deleteCourse: vi.fn(), updateCourse: vi.fn(), getCourseById: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}
const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

beforeEach(() => {
  vi.mocked(courseService.createCourse).mockReset();
  vi.mocked(courseService.deleteCourse).mockReset();
  vi.mocked(courseService.getCourseById).mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe("useCreateCourse (Q7-T05)", () => {
  it("thành công thì hook không toast (chỉ trang tạo khoá toast, tránh hai toast cùng lúc)", async () => {
    vi.mocked(courseService.createCourse).mockResolvedValue({ id: "c1" } as never);
    const { result } = renderHook(() => useCreateCourse(), { wrapper: makeWrapper(newClient()) });
    await act(async () => {
      await result.current.mutateAsync({ title: "x" } as never);
    });
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe("useDeleteCourse (Q7-T10)", () => {
  it("xoá xong không refetch chi tiết khoá vừa xoá (không 404), nhưng đánh dấu cũ", async () => {
    vi.mocked(courseService.getCourseById).mockResolvedValue({ id: "c1" } as never);
    vi.mocked(courseService.deleteCourse).mockResolvedValue(undefined as never);
    const client = newClient();
    const wrapper = makeWrapper(client);
    // Giả lập trang chi tiết: observer của useCourse(c1) vẫn mount khi DELETE trả về.
    renderHook(() => useQuery({ queryKey: courseKeys.detail("c1"), queryFn: () => courseService.getCourseById("c1") }), { wrapper });
    await waitFor(() => expect(courseService.getCourseById).toHaveBeenCalledTimes(1));

    const { result } = renderHook(() => useDeleteCourse(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync("c1");
    });

    expect(courseService.getCourseById).toHaveBeenCalledTimes(1);
    expect(client.getQueryState(courseKeys.detail("c1"))?.isInvalidated).toBe(true);
  });

  it("vẫn làm mới các danh sách khoá học", async () => {
    vi.mocked(courseService.deleteCourse).mockResolvedValue(undefined as never);
    const client = newClient();
    const listFetch = vi.fn().mockResolvedValue([]);
    const wrapper = makeWrapper(client);
    renderHook(() => useQuery({ queryKey: courseKeys.my(), queryFn: listFetch }), { wrapper });
    await waitFor(() => expect(listFetch).toHaveBeenCalledTimes(1));

    const { result } = renderHook(() => useDeleteCourse(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync("c1");
    });
    await waitFor(() => expect(listFetch).toHaveBeenCalledTimes(2));
  });
});
