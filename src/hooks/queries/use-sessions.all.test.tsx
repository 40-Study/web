/** Q8-T06: useAllClassSessions đi hết các trang (backend giới hạn 50 buổi/trang), không dừng ở trang 1. */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { createTestQueryClient } from "@/test/utils";
import { useAllClassSessions } from "./use-sessions";

const day = (i: number) => new Date(Date.parse("2026-03-01T00:00:00Z") + i * 86_400_000).toISOString().slice(0, 10);

describe("useAllClassSessions (Q8-T06)", () => {
  it("lớp 104 buổi, backend trả 50/trang: gom đủ 104 buổi theo thứ tự ngày tăng dần", async () => {
    resetMockApi();
    const all = Array.from({ length: 104 }, (_, i) => ({ id: `s${i}`, class_id: "c1", date: day(i), start_time: "19:00", end_time: "20:30", status: "scheduled" }));
    mockApi.get.mockImplementation((_url: string, config: { params: { page: number; page_size: number } }) => {
      const { page, page_size } = config.params;
      return Promise.resolve(envelope({ data: all.slice((page - 1) * page_size, page * page_size), total: 104, page, page_size }));
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useAllClassSessions("c1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const sessions = result.current.data!.sessions;
    expect(sessions).toHaveLength(104);
    expect(sessions[0].id).toBe("s0");
    expect(sessions[103].id).toBe("s103");
    expect(mockApi.get).toHaveBeenCalledTimes(3);
  });
});
