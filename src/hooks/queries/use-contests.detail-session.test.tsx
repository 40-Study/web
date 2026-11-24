/** QA5 S5-10: chi tiết cuộc thi chỉ tải sau khi phiên đăng nhập có kết quả, để `viewer` đúng người gọi. */
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppQueryClient } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";

const getBySlug = vi.fn();
vi.mock("@/services/contest.service", () => ({
  contestService: { getBySlug: (...a: unknown[]) => getBySlug(...a) },
}));

import { useContestDetail } from "./use-contests";

function setup() {
  const qc = createAppQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  return renderHook(() => useContestDetail("demo"), { wrapper });
}

beforeEach(() => {
  getBySlug.mockReset().mockResolvedValue({ viewer: { can_join: true } });
});

describe("useContestDetail — chờ phiên đăng nhập", () => {
  it("đang khôi phục phiên: không gọi API, báo isLoading", () => {
    useAuthStore.setState({ hasHydrated: true, sessionStatus: "checking" });
    const { result } = setup();
    expect(result.current.isLoading).toBe(true);
    expect(getBySlug).not.toHaveBeenCalled();
  });

  it("chưa hydrate cũng chờ", () => {
    useAuthStore.setState({ hasHydrated: false, sessionStatus: "anonymous" });
    const { result } = setup();
    expect(result.current.isLoading).toBe(true);
    expect(getBySlug).not.toHaveBeenCalled();
  });

  it("phiên khôi phục xong (authenticated): tải đúng một lần, có dữ liệu", async () => {
    useAuthStore.setState({ hasHydrated: true, sessionStatus: "checking" });
    const { result } = setup();
    expect(getBySlug).not.toHaveBeenCalled();
    act(() => useAuthStore.setState({ sessionStatus: "authenticated" }));
    await waitFor(() => expect(result.current.data).toEqual({ viewer: { can_join: true } }));
    expect(getBySlug).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("khách (anonymous) đã xác định: tải ngay", async () => {
    useAuthStore.setState({ hasHydrated: true, sessionStatus: "anonymous" });
    const { result } = setup();
    await waitFor(() => expect(result.current.data).toBeTruthy());
    expect(getBySlug).toHaveBeenCalledTimes(1);
  });
});
