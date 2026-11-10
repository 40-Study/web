/**
 * QA-B-11: trang chi tiết khoá đọc bài học từ GET /courses/:id/sections. Thao tác trên bài học (tạo/sửa/xoá/sắp
 * xếp) phải làm mới cả danh sách chương, nếu không bài mới tạo sẽ không hiện ra.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/lesson.service", () => ({
  lessonService: {
    createLesson: vi.fn().mockResolvedValue({ id: "l1" }),
    updateLesson: vi.fn().mockResolvedValue({ id: "l1" }),
    deleteLesson: vi.fn().mockResolvedValue(undefined),
    reorderLessons: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useCreateLesson, useDeleteLesson, useReorderLessons, useUpdateLesson } from "./use-lessons";

function setup<T>(hook: () => T) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const spy = vi.spyOn(qc, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  return { spy, result: renderHook(hook, { wrapper }).result };
}

const SECTIONS_KEY = { queryKey: ["sections", "course", "c1"] };

describe("lesson mutations làm mới danh sách chương (QA-B-11)", () => {
  it.each([
    ["tạo", () => useCreateLesson("c1", "s1"), (m: { mutateAsync: (v: never) => Promise<unknown> }) => m.mutateAsync({ title: "B" } as never)],
    ["sửa", () => useUpdateLesson("c1", "s1"), (m: { mutateAsync: (v: never) => Promise<unknown> }) => m.mutateAsync({ id: "l1", data: {} } as never)],
    ["xoá", () => useDeleteLesson("c1", "s1"), (m: { mutateAsync: (v: never) => Promise<unknown> }) => m.mutateAsync("l1" as never)],
    ["sắp xếp", () => useReorderLessons("c1", "s1"), (m: { mutateAsync: (v: never) => Promise<unknown> }) => m.mutateAsync([] as never)],
  ])("%s bài học -> invalidate sections của khoá", async (_label, hook, run) => {
    const { spy, result } = setup(hook as () => { mutateAsync: (v: never) => Promise<unknown> });
    await act(async () => {
      await run(result.current);
    });
    expect(spy).toHaveBeenCalledWith(SECTIONS_KEY);
  });
});
