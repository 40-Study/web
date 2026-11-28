/**
 * Q11-ADMIN-02: /admin đếm người dùng theo từng vai trò bằng N query riêng. Refetch nền của các query đếm lỗi mà còn số cache
 * thì giữ số (thẻ "Tổng lượt gán vai trò" và huy hiệu từng vai trò) + MỘT thông báo cấp trang; không đổi thành "lỗi".
 * Dùng hook THẬT (mockApi), không mock `use-admin`: bản mock ở page.stale-refetch.test.tsx không thấy được lỗi này.
 */
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("@/components/guards", () => ({ Can: () => null }));

import AdminIndexPage from "./page";
import { ApiError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { expectStaleNoticeWithRetry, refetchAllActiveQueries } from "@/test/stale-refetch";
import { createTestQueryClient, renderWithProviders } from "@/test/utils";

const roles = [
  { id: "r1", name: "SYSTEM_ADMIN", description: "Quản trị" },
  { id: "r2", name: "TEACHER", description: "Giảng viên" },
];
const totals: Record<string, number> = { r1: 3, r2: 22 };

let failCounts = false;
beforeEach(() => {
  resetMockApi();
  failCounts = false;
  mockApi.get.mockImplementation(async (url: string) => {
    const users = /^\/system-roles\/(\w+)\/users$/.exec(url);
    if (users) {
      if (failCounts) throw new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");
      return envelope({ user_system_roles: [], total: totals[users[1]], page: 1, page_size: 1 });
    }
    if (url === "/system-roles") return envelope({ roles });
    if (url === "/organizations") return envelope({ organizations: [], total: 4, page: 1, page_size: 1 });
    if (url === "/permissions") return envelope({ permissions: [{ id: "p1", name: "X" }], total: 1 });
    throw new Error(`unexpected GET ${url}`);
  });
});

describe("/admin — đếm theo vai trò refetch lỗi (Q11-ADMIN-02)", () => {
  it("còn số cache: giữ tổng (25) và huy hiệu từng vai trò, một thông báo cấp trang, không có 'lỗi'", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setDefaultOptions({ queries: { retry: false, staleTime: 0, gcTime: 60_000 } });
    renderWithProviders(<AdminIndexPage />, { queryClient });
    await screen.findByText("25");
    expect(screen.getByText("22 người")).toBeTruthy();

    failCounts = true;
    await refetchAllActiveQueries(queryClient);
    await expectStaleNoticeWithRetry();
    expect(screen.getByText("25")).toBeTruthy();
    expect(screen.getByText("22 người")).toBeTruthy();
    expect(screen.queryByText("lỗi")).toBeNull();
    expect(screen.queryByText(/thiếu quyền hoặc hệ thống đang lỗi/)).toBeNull();

    failCounts = false;
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await screen.findByText("25");
    await vi.waitFor(() => expect(screen.queryByRole("status")?.textContent ?? "").not.toMatch(/Không cập nhật được/));
  });

  it("lỗi LẦN ĐẦU (chưa có số): vẫn hiện 'lỗi' trên thẻ và huy hiệu như trước (không giả có số)", async () => {
    failCounts = true;
    renderWithProviders(<AdminIndexPage />);
    expect(await screen.findAllByText("lỗi")).not.toHaveLength(0);
  });
});
