/**
 * Review #124 (S11): bắt đầu làm bài xong phải làm mới chi tiết cuộc thi. Không thì cache (staleTime 30 s)
 * còn ghi NOT_STARTED và bước "Sẵn sàng làm bài?" hiện lại trong khi đồng hồ server đã chạy.
 */
import { act, renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { createAppQueryClient } from "@/lib/query-client";

const start = vi.fn();
vi.mock("@/services/contest.service", () => ({
  contestService: { start: (...a: unknown[]) => start(...a) },
}));

import { contestKeys, useStartContest } from "./use-contests";

describe("useStartContest", () => {
  it("bắt đầu thành công thì đánh dấu chi tiết cuộc thi (theo slug) là cũ", async () => {
    start.mockResolvedValue({ attempt_id: "a1" });
    const qc = createAppQueryClient();
    qc.setQueryData(contestKeys.detail("demo"), { viewer: { my_participation: { attempt_status: "NOT_STARTED" } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useStartContest("demo"), { wrapper });

    expect(qc.getQueryState(contestKeys.detail("demo"))?.isInvalidated).toBe(false);
    await act(async () => {
      await result.current.mutateAsync("c1");
    });
    expect(start).toHaveBeenCalledWith("c1");
    expect(qc.getQueryState(contestKeys.detail("demo"))?.isInvalidated).toBe(true);
    qc.clear();
  });
});
