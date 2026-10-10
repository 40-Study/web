/**
 * Review đối kháng PR #24 (MAJOR) — khu vực /admin/** trước đây cho cả ORG_OWNER vào
 * (`RoleGuard roles={["SYSTEM_ADMIN", "ORG_OWNER"]}`), nhưng backend (data/roles.json) không cấp
 * ROLES_MANAGE_SYSTEM/REPORTS_MODERATE/CATEGORIES_SYSTEM_MANAGE cho ORG_OWNER — 4/6 trang admin
 * vô dụng với vai này dù UI vẫn cho vào. 40Study là B2C một doanh nghiệp (không đa tổ chức) nên
 * chỉ SYSTEM_ADMIN được vào toàn bộ khu vực admin.
 *
 * Test ĐỎ nếu roles quay lại bao gồm "ORG_OWNER".
 */

import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import AdminLayout from "./layout";
import { useAuthStore } from "@/stores/auth.store";
import { renderWithProviders } from "@/test/utils";

beforeEach(() => {
  useAuthStore.getState().reset();
});

describe("(admin)/layout — RoleGuard", () => {
  it("SYSTEM_ADMIN vào được, thấy nội dung con", async () => {
    useAuthStore.getState().setSessionStatus("authenticated");
    useAuthStore.getState().setActiveRole("SYSTEM_ADMIN");

    renderWithProviders(
      <AdminLayout>
        <div>NOI DUNG ADMIN</div>
      </AdminLayout>
    );

    await screen.findByText("NOI DUNG ADMIN");
  });

  it("menu quản trị có mục \"Cuộc thi\" trỏ tới /admin/contests (contract contest-feature §7)", async () => {
    useAuthStore.getState().setSessionStatus("authenticated");
    useAuthStore.getState().setActiveRole("SYSTEM_ADMIN");

    renderWithProviders(
      <AdminLayout>
        <div>NOI DUNG ADMIN</div>
      </AdminLayout>
    );

    await screen.findByText("NOI DUNG ADMIN");
    const nav = screen.getByRole("navigation", { name: "Menu quản trị" });
    const link = within(nav).getByRole("link", { name: /Cuộc thi/ });
    expect(link.getAttribute("href")).toBe("/admin/contests");
  });

  it.each([
    ["Nhật ký hoạt động", "/admin/audit-logs"],
    ["Thông báo hệ thống", "/admin/notifications"],
    ["Cấu hình hệ thống", "/admin/settings"],
  ])("menu quản trị có mục %s trỏ tới %s (plan 261008 phase 8)", async (label, href) => {
    useAuthStore.getState().setSessionStatus("authenticated");
    useAuthStore.getState().setActiveRole("SYSTEM_ADMIN");
    useAuthStore.getState().setPermissions(["SYSTEM_SETTINGS_MANAGE"]);

    renderWithProviders(
      <AdminLayout>
        <div>NOI DUNG ADMIN</div>
      </AdminLayout>
    );

    await screen.findByText("NOI DUNG ADMIN");
    const nav = screen.getByRole("navigation", { name: "Menu quản trị" });
    expect(within(nav).getByRole("link", { name: label }).getAttribute("href")).toBe(href);
  });

  // L6 (QA 261009): 3 mục này gọi API cần SYSTEM_SETTINGS_MANAGE; admin kém quyền bấm vào chỉ thấy 403.
  it.each([
    ["Nhật ký hoạt động"],
    ["Thông báo hệ thống"],
    ["Cấu hình hệ thống"],
  ])("L6: admin KHÔNG có SYSTEM_SETTINGS_MANAGE -> mục %s bị ẩn ở cả menu desktop và mobile, các mục khác vẫn còn", async (label) => {
    useAuthStore.getState().setSessionStatus("authenticated");
    useAuthStore.getState().setActiveRole("SYSTEM_ADMIN");
    useAuthStore.getState().setPermissions(["USERS_VIEW_ALL"]);

    renderWithProviders(
      <AdminLayout>
        <div>NOI DUNG ADMIN</div>
      </AdminLayout>
    );

    await screen.findByText("NOI DUNG ADMIN");
    expect(screen.queryAllByRole("link", { name: label })).toHaveLength(0);
    const nav = screen.getByRole("navigation", { name: "Menu quản trị" });
    expect(within(nav).getByRole("link", { name: /Cuộc thi/ })).toBeTruthy();
    expect(within(nav).getByRole("link", { name: "Người dùng" })).toBeTruthy();
  });

  it("L6: có SYSTEM_SETTINGS_MANAGE -> mục hiện ở cả menu desktop lẫn mobile", async () => {
    useAuthStore.getState().setSessionStatus("authenticated");
    useAuthStore.getState().setActiveRole("SYSTEM_ADMIN");
    useAuthStore.getState().setPermissions(["SYSTEM_SETTINGS_MANAGE"]);

    renderWithProviders(
      <AdminLayout>
        <div>NOI DUNG ADMIN</div>
      </AdminLayout>
    );

    await screen.findByText("NOI DUNG ADMIN");
    expect(screen.getAllByRole("link", { name: "Nhật ký hoạt động" })).toHaveLength(2);
  });

  it("ORG_OWNER KHÔNG vào được — không thấy nội dung con (bị RoleGuard chặn, redirect /403)", async () => {
    useAuthStore.getState().setSessionStatus("authenticated");
    useAuthStore.getState().setActiveRole("ORG_OWNER");

    renderWithProviders(
      <AdminLayout>
        <div>NOI DUNG ADMIN</div>
      </AdminLayout>
    );

    // RoleGuard render null khi role không được phép — đợi một nhịp rồi khẳng định không có nội
    // dung con nào lọt ra ngoài.
    await waitFor(() => {
      expect(screen.queryByText("NOI DUNG ADMIN")).toBeNull();
    });
  });
});
