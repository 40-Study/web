/**
 * Review QA2 #4: danh sách /teacher/classes (`classKeys.mine()`) không bao giờ bị làm mới khi tạo, sửa, xoá, lưu trữ
 * hay đổi sĩ số lớp — staleTime 30s nên giảng viên quay lại thấy lớp cũ, lớp đã xoá vẫn có link dẫn tới 404.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { classService } from "@/services/class.service";
import { classKeys, useAddStudent, useCreateClass, useDeleteClass, useUpdateClass } from "./use-classes";
import { useClassManageActions } from "./use-class-manage";

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(classKeys.mine(), []);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const isStale = () => client.getQueryState(classKeys.mine())?.isInvalidated === true;
  return { wrapper, isStale };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("classKeys.mine() được làm mới sau mọi thay đổi lớp", () => {
  it.each([
    ["tạo lớp", () => vi.spyOn(classService, "create").mockResolvedValue({} as never), (h: ReturnType<typeof useCreateClass>) => h.mutate({ name: "Lớp" }), useCreateClass],
    ["sửa lớp", () => vi.spyOn(classService, "update").mockResolvedValue({} as never), (h: ReturnType<typeof useUpdateClass>) => h.mutate({ classId: "k1", data: { name: "x" } }), useUpdateClass],
    ["xoá lớp", () => vi.spyOn(classService, "delete").mockResolvedValue({} as never), (h: ReturnType<typeof useDeleteClass>) => h.mutate("k1"), useDeleteClass],
    ["thêm học viên (đổi sĩ số)", () => vi.spyOn(classService, "addStudent").mockResolvedValue({} as never), (h: ReturnType<typeof useAddStudent>) => h.mutate({ classId: "k1", studentId: "s1" }), useAddStudent],
  ] as const)("%s", async (_name, mockService, run, useHook) => {
    mockService();
    const { wrapper, isStale } = setup();
    const { result } = renderHook(() => (useHook as (id: string) => never)("course-1"), { wrapper });
    act(() => (run as (h: never) => void)(result.current));
    await waitFor(() => expect(isStale()).toBe(true));
  });

  it("lưu trữ lớp ở trang quản lý (useClassManageActions.update status=archived)", async () => {
    vi.spyOn(classService, "updateByClassId").mockResolvedValue({} as never);
    const { wrapper, isStale } = setup();
    const { result } = renderHook(() => useClassManageActions("k1"), { wrapper });
    act(() => result.current.update.mutate({ status: "archived" }));
    await waitFor(() => expect(isStale()).toBe(true));
  });
});
