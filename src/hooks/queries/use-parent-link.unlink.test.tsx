/**
 * Review #38 W3: huỷ liên kết phải bỏ cache dữ liệu con (backend đã từ chối mọi API xem dữ liệu con)
 * và làm mới danh sách con; phía học sinh phải làm mới cả danh sách lời mời (backend thu hồi lời
 * mời còn chờ của cặp — review #81 MAJOR-2).
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { authKeys } from "@/hooks/queries/use-auth";
import { invitationKeys } from "@/hooks/queries/use-invitation";
import { parentDashboardKeys } from "@/hooks/queries/use-parent-dashboard";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { createTestQueryClient } from "@/test/utils";
import { parentLinkKeys, useUnlinkChild, useUnlinkParent } from "./use-parent-link";

function setup() {
  const client = createTestQueryClient();
  // gcTime mặc định 0 của test client xoá cache không có observer — giữ lại để quan sát.
  client.setDefaultOptions({ queries: { gcTime: Infinity } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

beforeEach(() => {
  resetMockApi();
  mockApi.delete.mockResolvedValue({ data: { message: "ok" } });
});

describe("useUnlinkChild", () => {
  it("xoá cache dữ liệu con và invalidate danh sách con", async () => {
    const { client, wrapper } = setup();
    const childKey = [...parentDashboardKeys.all, "child", "c-1"];
    client.setQueryData(childKey, { name: "con" });
    client.setQueryData(authKeys.children(), { children: [] });

    const { result } = renderHook(() => useUnlinkChild(), { wrapper });
    await act(() => result.current.mutateAsync("c-1"));

    expect(mockApi.delete).toHaveBeenCalledWith("/family/children/c-1");
    expect(client.getQueryData(childKey)).toBeUndefined();
    await waitFor(() => expect(client.getQueryState(authKeys.children())?.isInvalidated).toBe(true));
  });
});

describe("useUnlinkParent", () => {
  it("invalidate phụ huynh đang liên kết và lời mời đã gửi", async () => {
    const { client, wrapper } = setup();
    client.setQueryData(parentLinkKeys.parents(), []);
    client.setQueryData(invitationKeys.sent(), []);

    const { result } = renderHook(() => useUnlinkParent(), { wrapper });
    await act(() => result.current.mutateAsync("p-1"));

    expect(mockApi.delete).toHaveBeenCalledWith("/family/parents/p-1");
    expect(client.getQueryState(parentLinkKeys.parents())?.isInvalidated).toBe(true);
    expect(client.getQueryState(invitationKeys.sent())?.isInvalidated).toBe(true);
  });
});
