/**
 * Q10-STU-01: /coins tải được, rồi refetch nền lỗi 500: số dư ví đã có phải còn nguyên kèm thông báo "Thử lại" (trước đây
 * cả khung số dư đổi thành hộp lỗi). Lần tải đầu lỗi vẫn là hộp lỗi.
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/coins",
  useSearchParams: () => new URLSearchParams(),
}));

import CoinsPage from "./page";
import { ApiError } from "@/lib/errors";
import { useAuthStore } from "@/stores/auth.store";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { expectStaleNoticeWithRetry, refetchAllActiveQueries, staleNoticeCount } from "@/test/stale-refetch";
import { renderWithProviders } from "@/test/utils";

const WALLET = { id: "w1", user_id: "u1", balance: 590, total_earned: 700, total_spent: 110, created_at: "", updated_at: "" };

let failing = false;
beforeEach(() => {
  resetMockApi();
  failing = false;
  useAuthStore.setState({ isAuthenticated: true, activeRole: "STUDENT" });
  mockApi.get.mockImplementation(async (url: string) => {
    if (failing) throw new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");
    if (url === "/coins/wallet") return envelope(WALLET);
    return envelope([]);
  });
});

describe("/coins — Q10-STU-01 (ví)", () => {
  it("refetch nền lỗi: số dư còn nguyên + thông báo 'Thử lại'", async () => {
    const { queryClient } = renderWithProviders(<CoinsPage />);
    await screen.findByText("XU HIỆN CÓ");
    await screen.findByText("590");

    failing = true;
    await refetchAllActiveQueries(queryClient);

    // Q10 #148 M3: ví + gói xu cùng lỗi mà cả trang chỉ có MỘT thông báo (một live region, một nút "Thử lại").
    await expectStaleNoticeWithRetry();
    expect(staleNoticeCount()).toBe(1);
    expect(screen.getByText("XU HIỆN CÓ")).toBeTruthy();
    expect(screen.getByText("590")).toBeTruthy();
  });

  it("lần tải đầu lỗi: hộp lỗi thay khung số dư", async () => {
    failing = true;
    renderWithProviders(<CoinsPage />);
    expect((await screen.findAllByRole("alert"))[0].textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText("XU HIỆN CÓ")).toBeNull();
  });
});
