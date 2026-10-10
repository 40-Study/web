/**
 * A-P2-2 regression — dashboard /admin trước đây:
 *  - "Tổng user được gán role" luôn hardcode "—" dù có dữ liệu.
 *  - "Top vai trò theo số lượng user" chỉ `roles.slice(0, 4)` — không sắp xếp theo số user thật,
 *    nên nhãn "Top" sai (thứ tự ngẫu nhiên theo API).
 *
 * Test ĐỎ nếu "—" quay lại xuất hiện dù có dữ liệu, hoặc nếu role có ÍT user hơn lại đứng
 * trước role có NHIỀU user hơn trong danh sách "Top vai trò".
 */

import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import AdminIndexPage from "./page";
import { ApiError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import { useAuthStore } from "@/stores/auth.store";

// STUDENT có ít user hơn TEACHER — nếu sort đúng, TEACHER phải đứng TRƯỚC STUDENT trong "Top".
const ROLES = [
  { id: "role-student", name: "STUDENT", description: "Học viên" },
  { id: "role-teacher", name: "TEACHER", description: "Giảng viên" },
];

const USER_COUNT_BY_ROLE: Record<string, number> = {
  "role-student": 2,
  "role-teacher": 7,
};

let AUDIT_PAGE: unknown;

beforeEach(() => {
  useAuthStore.getState().reset();
  useAuthStore.getState().setSessionStatus("authenticated");
  useAuthStore.getState().setPermissions(["SYSTEM_SETTINGS_MANAGE"]);
  AUDIT_PAGE = { items: [], total: 0, page: 1, page_size: 5 };
  resetMockApi();
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/organizations") return envelope({ organizations: [{ id: "org-1", name: "ForteX", code: "FX" }] });
    if (url === "/system-roles") return envelope({ roles: ROLES });
    if (url === "/permissions") return envelope({ permissions: [{ id: "p1", name: "PERM_1", category: "X" }], total: 1 });
    const usersMatch = url.match(/^\/system-roles\/([^/]+)\/users$/);
    if (usersMatch) {
      const total = USER_COUNT_BY_ROLE[usersMatch[1]] ?? 0;
      return envelope({ user_system_roles: [], total, page: 1, page_size: 1 });
    }
    if (url === "/admin/audit-logs") return envelope(AUDIT_PAGE);
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });
});

describe("/admin dashboard — A-P2-2", () => {
  it("Tổng lượt gán role hiển thị số thật (2 + 7 = 9), không còn '—'", async () => {
    renderWithProviders(<AdminIndexPage />);

    await screen.findByText("9");
    expect(screen.queryByText("—")).toBeNull();
  });

  it("Top vai trò sắp xếp GIẢM DẦN theo số user — TEACHER (7) đứng trước STUDENT (2)", async () => {
    renderWithProviders(<AdminIndexPage />);

    const heading = await screen.findByText("Top vai trò theo số lượng user");
    const panel = heading.closest("div");
    if (!panel) throw new Error("Không tìm thấy panel Top vai trò");

    await screen.findByText("STUDENT", { selector: "p" });
    const rowTexts = within(panel)
      .getAllByText(/^(STUDENT|TEACHER)$/)
      .map((el) => el.textContent);

    expect(rowTexts.indexOf("TEACHER")).toBeLessThan(rowTexts.indexOf("STUDENT"));
  });

  it("Hoạt động gần đây hiện nhật ký thật (hành động, người thao tác, giờ VN) kèm link Xem tất cả", async () => {
    AUDIT_PAGE = {
      items: [
        { id: "a1", created_at: "2026-10-09T03:15:00Z", actor: { id: "u1", name: "Quản trị A", email: "a@x.vn" }, action: "user.lock", target_type: "user", target_id: "u9", status_code: 200, ip: null, metadata: null },
        { id: "a2", created_at: "2026-10-09T02:00:00Z", actor: null, action: "notification.broadcast", target_type: "", target_id: null, status_code: 201, ip: null, metadata: null },
      ],
      total: 2, page: 1, page_size: 5,
    };
    renderWithProviders(<AdminIndexPage />);

    await screen.findByText(/Quản trị A · /);
    expect(screen.getByText(/^— · /)).toBeTruthy();
    expect(screen.queryByText("Chưa có nhật ký hoạt động")).toBeNull();
    expect(screen.getByRole("link", { name: "Xem tất cả" }).getAttribute("href")).toBe("/admin/audit-logs");
    const call = mockApi.get.mock.calls.find((c) => c[0] === "/admin/audit-logs");
    expect(call?.[1]).toEqual({ params: { page_size: 5 } });
  });

  it("admin thiếu quyền nhật ký (403): chỉ khối Hoạt động gần đây báo lỗi, các số liệu khác vẫn hiện", async () => {
    const base = mockApi.get.getMockImplementation();
    mockApi.get.mockImplementation(async (url: string, ...rest: unknown[]) => {
      if (url === "/admin/audit-logs") throw new ApiError(403, "FORBIDDEN", "Bạn không có quyền xem nhật ký hoạt động.");
      return base!(url, ...rest);
    });
    renderWithProviders(<AdminIndexPage />);

    await screen.findByText("9");
    expect(await screen.findByText(/Bạn không có quyền xem nhật ký hoạt động\./)).toBeTruthy();
    expect(screen.getByText("Tổng lượt gán role")).toBeTruthy();
  });
  // L6 (QA 261009): API nhật ký cần SYSTEM_SETTINGS_MANAGE — admin kém quyền không được thấy thẻ báo lỗi, và không bắn request 403.
  it("L6: admin KHÔNG có SYSTEM_SETTINGS_MANAGE -> ẩn cả khối Hoạt động gần đây và không gọi /admin/audit-logs", async () => {
    useAuthStore.getState().setPermissions(["USERS_VIEW_ALL"]);
    renderWithProviders(<AdminIndexPage />);

    await screen.findByText("9");
    expect(screen.queryByText("Hoạt động gần đây")).toBeNull();
    expect(screen.queryByRole("link", { name: "Xem tất cả" })).toBeNull();
    expect(mockApi.get.mock.calls.some((c) => c[0] === "/admin/audit-logs")).toBe(false);
    // Các số liệu khác của dashboard vẫn hiện.
    expect(screen.getByText("Top vai trò theo số lượng user")).toBeTruthy();
  });
});
