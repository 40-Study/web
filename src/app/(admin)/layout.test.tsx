/**
 * Review đối kháng PR #24 (MAJOR) — khu vực /admin/** trước đây cho cả ORG_OWNER vào
 * (`RoleGuard roles={["SYSTEM_ADMIN", "ORG_OWNER"]}`), nhưng backend (data/roles.json) không cấp
 * ROLES_MANAGE_SYSTEM/REPORTS_MODERATE/CATEGORIES_SYSTEM_MANAGE cho ORG_OWNER — 4/6 trang admin
 * vô dụng với vai này dù UI vẫn cho vào. 40Study là B2C một doanh nghiệp (không đa tổ chức) nên
 * chỉ SYSTEM_ADMIN được vào toàn bộ khu vực admin.
 *
 * Test ĐỎ nếu roles quay lại bao gồm "ORG_OWNER".
 */

import { screen, waitFor } from "@testing-library/react";
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
