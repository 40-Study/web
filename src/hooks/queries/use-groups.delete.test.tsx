/**
 * QA4 S17: xoá nhóm xong vẫn refetch `GET /groups/:slug` (404 trong console) vì trang chi tiết còn gắn query
 * đó khi onSuccess làm mới mọi khoá "groups". Query của nhóm vừa xoá phải bị gỡ, không được gọi lại.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const getBySlug = vi.fn();
const del = vi.fn();
vi.mock("@/services/group.service", () => ({
  groupService: {
    getBySlug: (...a: unknown[]) => getBySlug(...a),
    delete: (...a: unknown[]) => del(...a),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { groupKeys, useDeleteGroup, useGroup } from "./use-groups";

describe("useDeleteGroup (S17)", () => {
  it("không gọi lại GET nhóm đã xoá dù trang chi tiết vẫn đang gắn query", async () => {
    getBySlug.mockResolvedValue({ id: "g1", slug: "nhom-thu", name: "Nhóm thử" });
    del.mockResolvedValue(undefined);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

    const { result } = renderHook(() => ({ detail: useGroup("nhom-thu"), remove: useDeleteGroup() }), { wrapper });
    await waitFor(() => expect(result.current.detail.data?.id).toBe("g1"));
    expect(getBySlug).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.remove.mutateAsync({ id: "g1", slug: "nhom-thu" });
    });
    await new Promise((r) => setTimeout(r, 20));

    expect(del).toHaveBeenCalledWith("g1");
    expect(getBySlug).toHaveBeenCalledTimes(1);
    // Danh sách nhóm vẫn được làm mới (chỉ query của nhóm đã xoá bị loại trừ).
    expect(qc.getQueryCache().find({ queryKey: groupKeys.detail("nhom-thu") })?.state.isInvalidated).toBe(false);
    qc.clear();
  });
});
