/**
 * Q10 #148 L1/L3: /admin gộp 3 query (tổ chức, vai trò, quyền). Trước đây `hasData` là AND của cả ba nên một query lỗi LẦN ĐẦU
 * khiến bảng hiện "dữ liệu cũ", còn query khác còn cache lại bị hộp lỗi thay mất. Nay: chỉ khi MỌI query đang lỗi đều còn cache
 * mới giữ trang + thông báo; còn lại là hộp lỗi. 'Thử lại' chỉ làm mới query đang lỗi và trả Promise (nút bận).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refetch = { org: vi.fn(async () => undefined), roles: vi.fn(async () => undefined), perms: vi.fn(async () => undefined) };
let org: { data: unknown; isError: boolean };
let roles: { hasRolesData: boolean; isError: boolean };
let perms: { data: unknown; isError: boolean };

vi.mock("@/hooks/queries/use-admin", () => ({
  useOrganizationsPage: () => ({ ...org, isLoading: false, refetch: refetch.org }),
  useSystemRolesWithUserCounts: () => ({
    roles: [{ id: "r1", name: "SYSTEM_ADMIN", userCount: 2 }],
    totalAssignedUsers: 2,
    totalAssignedUsersError: false,
    isLoading: false,
    ...roles,
    refetch: refetch.roles,
  }),
  usePermissions: () => ({ ...perms, isLoading: false, refetch: refetch.perms }),
}));
vi.mock("@/hooks/queries/use-audit-logs", () => ({ useAuditLogs: () => ({ data: { items: [] }, isLoading: false, isError: false, refetch: vi.fn() }) }));
vi.mock("@/components/guards", () => ({ Can: () => null }));

import AdminIndexPage from "./page";

beforeEach(() => {
  Object.values(refetch).forEach((fn) => fn.mockClear());
  org = { data: { total: 3 }, isError: false };
  roles = { hasRolesData: true, isError: false };
  perms = { data: [{ id: "p1" }], isError: false };
});

describe("/admin — Q10 #148 L1/L3", () => {
  it("không lỗi: hiện số liệu, không có thông báo", () => {
    render(<AdminIndexPage />);
    expect(screen.getByText("Tổng tổ chức")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("một query lỗi mà còn cache: giữ số liệu + thông báo, 'Thử lại' chỉ làm mới đúng query đó", () => {
    perms = { data: [{ id: "p1" }], isError: true };
    render(<AdminIndexPage />);
    expect(screen.getByText("Tổng tổ chức")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Không cập nhật được dữ liệu mới");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch.perms).toHaveBeenCalledTimes(1);
    expect(refetch.org).not.toHaveBeenCalled();
    expect(refetch.roles).not.toHaveBeenCalled();
  });

  it("L1: một query lỗi LẦN ĐẦU (chưa có data) dù các query khác còn cache: hộp lỗi, KHÔNG ghi 'dữ liệu cũ'", () => {
    org = { data: undefined, isError: true };
    render(<AdminIndexPage />);
    expect(screen.getByRole("alert").textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/dữ liệu cũ/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch.org).toHaveBeenCalledTimes(1);
    expect(refetch.perms).not.toHaveBeenCalled();
  });

  it("một query lỗi lần đầu + một query khác lỗi mà còn cache: vẫn là hộp lỗi (không che lỗi lần đầu)", () => {
    org = { data: undefined, isError: true };
    perms = { data: [{ id: "p1" }], isError: true };
    render(<AdminIndexPage />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch.org).toHaveBeenCalledTimes(1);
    expect(refetch.perms).toHaveBeenCalledTimes(1);
  });
});
