/**
 * Q11-T-01: trang điểm danh khoá theo `failureCount > 0`, nên phải chứng minh react-query THẬT báo `failureCount` > 0 và vẫn giữ
 * `data` cũ trong lúc `isError` còn false (đang thử lại); nếu giả định này sai thì test của trang chỉ chứng minh một mock.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";

const getAttendances = vi.fn();
vi.mock("@/services/session.service", async (orig) => ({
  ...(await orig<typeof import("@/services/session.service")>()),
  sessionService: { getAttendances: (...a: unknown[]) => getAttendances(...a) },
}));

// eslint-disable-next-line import/first
import { useSessionAttendances } from "./use-sessions";

// Khối {} để KHÔNG trả về mock: vitest coi hàm được trả về từ beforeEach là teardown và sẽ GỌI nó (chạy queryFn giả).
beforeEach(() => {
  getAttendances.mockReset();
});

describe("useSessionAttendances — failureCount trong lúc thử lại (Q11-T-01)", () => {
  it("refetch lỗi: failureCount > 0 và data cũ còn nguyên TRƯỚC KHI isError bật", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: 3, retryDelay: 5, staleTime: 0 } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    getAttendances.mockResolvedValueOnce([{ id: "a1" }]);
    const { result, unmount } = renderHook(() => useSessionAttendances("s1"), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual([{ id: "a1" }]));
    expect(result.current.failureCount).toBe(0);

    // Lần thử đầu lỗi, các lần thử lại treo mãi: giữ trạng thái "đang thử lại" và không để lỗi nào rơi ra ngoài test.
    getAttendances.mockRejectedValueOnce(new ApiError(500, "UNKNOWN", "boom"));
    getAttendances.mockImplementation(() => new Promise(() => undefined));
    void result.current.refetch();

    await waitFor(() => expect(result.current.failureCount).toBeGreaterThan(0));
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual([{ id: "a1" }]);

    // Dọn lượt thử lại còn treo TRƯỚC khi gỡ hook, để cleanup của testing-library không chờ mãi.
    unmount();
    await client.cancelQueries();
    client.clear();
  });
});
