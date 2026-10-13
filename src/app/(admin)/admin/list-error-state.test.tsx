/**
 * ADM-N2 (QA2 261013): khi API danh sách lỗi, trang admin phải hiện thông báo lỗi + nút "Thử lại",
 * KHÔNG được để skeleton "Đang tải dữ liệu…" quay mãi. Test đi qua hook + service THẬT (chỉ giả lập
 * tầng HTTP trả ApiError 500, với đúng cấu hình retry của app) để lỗi bị nuốt ở bất kỳ tầng nào cũng
 * làm test đỏ. Ghi chú: ở HEAD lỗi này không tái hiện được — test khoá hành vi đúng, không phải RED->GREEN.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";
import { shouldRetryQuery } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";

const mocks = vi.hoisted(() => ({
  userList: vi.fn(),
  getSettings: vi.fn(),
  adminList: vi.fn(),
}));

vi.mock("@/services/user.service", () => ({ userService: { list: mocks.userList } }));
vi.mock("@/services/role.service", () => ({ roleService: { listSystemRoles: vi.fn().mockResolvedValue([]) } }));
vi.mock("@/services/admin-report.service", () => ({
  adminReportService: { getAdminSettings: mocks.getSettings },
}));
vi.mock("@/services/course-approval.service", () => ({
  courseApprovalService: { adminList: mocks.adminList },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/users",
  useSearchParams: () => new URLSearchParams(),
}));

import AdminCoursesPage from "./courses/page";
import AdminSettingsPage from "./settings/page";
import AdminUsersPage from "./users/page";

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: shouldRetryQuery, retryDelay: 0, staleTime: 0 } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const serverError = () => new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());
  useAuthStore.setState({
    sessionStatus: "authenticated",
    permissions: ["MANAGE_PLATFORM_FEE", "SYSTEM_SETTINGS_MANAGE", "USERS_BAN"],
  } as Partial<ReturnType<typeof useAuthStore.getState>>);
});

const cases: Array<[string, () => ReactNode, () => ReturnType<typeof vi.fn>]> = [
  ["/admin/users", () => <AdminUsersPage />, () => mocks.userList],
  ["/admin/settings", () => <AdminSettingsPage />, () => mocks.getSettings],
  ["/admin/courses", () => <AdminCoursesPage />, () => mocks.adminList],
];

describe.each(cases)("%s khi API trả 500", (_name, page, fetcher) => {
  it("hiện lỗi + nút Thử lại, không kẹt ở skeleton", async () => {
    fetcher().mockRejectedValue(serverError());
    renderWithClient(page());

    expect(await screen.findByText("Không thể tải dữ liệu")).toBeTruthy();
    expect(screen.queryByText("Đang tải dữ liệu…")).toBeNull();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
  });

  it("bấm Thử lại gọi API lần nữa và hiện dữ liệu khi API phục hồi", async () => {
    const user = userEvent.setup();
    fetcher().mockRejectedValue(serverError());
    renderWithClient(page());
    await screen.findByText("Không thể tải dữ liệu");
    const callsBeforeRetry = fetcher().mock.calls.length;

    fetcher().mockResolvedValue(
      fetcher() === mocks.getSettings
        ? { platform_fee_percent: 5, updated_at: null, updated_by: null }
        : fetcher() === mocks.userList
          ? { items: [], total_pages: 1, total_count: 0, page: 1 }
          : { courses: [], total: 0, page: 1, page_size: 20 }
    );
    await user.click(screen.getByRole("button", { name: "Thử lại" }));

    await waitFor(() => expect(fetcher().mock.calls.length).toBeGreaterThan(callsBeforeRetry));
    await waitFor(() => expect(screen.queryByText("Không thể tải dữ liệu")).toBeNull());
  });
});
