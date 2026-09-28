/**
 * useFinalizeContest — lỗi voucher khi chốt (409 + details) KHÔNG bật toast tự tắt: trang hiện alert
 * cố định thay thế. Lỗi chốt khác vẫn toast tiếng Việt như cũ.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTestQueryClient } from "@/test/utils";

const mockToastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a), success: vi.fn(), info: vi.fn() } }));

const mockFinalize = vi.fn();
vi.mock("@/services/contest-manage.service", () => ({
  contestManageService: { finalize: (...a: unknown[]) => mockFinalize(...a) },
}));

// eslint-disable-next-line import/first
import { ContestApiError } from "@/services/contest.service";
// eslint-disable-next-line import/first
import { useFinalizeContest } from "./use-contest-manage";

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

const DETAILS = { user_id: "u-1", user_name: "Nguyễn An", rank: 2, voucher_id: "v-1", voucher_code: "GIAI1", reason: "hết lượt" };

describe("useFinalizeContest", () => {
  beforeEach(() => {
    mockToastError.mockReset();
    mockFinalize.mockReset();
  });

  it("lỗi voucher có details → không toast (alert cố định lo phần hiển thị)", async () => {
    mockFinalize.mockRejectedValue(new ContestApiError(409, "CONTEST_VOUCHER_UNAVAILABLE", "x", DETAILS));
    const { result } = renderHook(() => useFinalizeContest(), { wrapper });
    result.current.mutate("c-1");
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("lỗi chốt khác (409 CONTEST_NOT_ENDED) → vẫn toast tiếng Việt", async () => {
    mockFinalize.mockRejectedValue(new ContestApiError(409, "CONTEST_NOT_ENDED", "x"));
    const { result } = renderHook(() => useFinalizeContest(), { wrapper });
    result.current.mutate("c-1");
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(expect.stringMatching(/60 giây/)));
  });
});
