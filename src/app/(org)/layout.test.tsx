/**
 * B-02: chủ tổ chức chọn vai "Chủ tổ chức" không còn rơi vào /403. Khu /org chỉ dành cho ORG_OWNER; /admin vẫn chỉ cho
 * SYSTEM_ADMIN (xem (admin)/layout.test.tsx). Test ĐỎ nếu RoleGuard của /org đổi vai được phép.
 */

import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import OrgLayout from "./layout";
import { useAuthStore } from "@/stores/auth.store";
import { renderWithProviders } from "@/test/utils";
import { getRoleHomeRoute } from "@/lib/routes";

beforeEach(() => {
  useAuthStore.getState().reset();
});

function renderLayout() {
  return renderWithProviders(
    <OrgLayout>
      <div>NOI DUNG TO CHUC</div>
    </OrgLayout>
  );
}

describe("(org)/layout — RoleGuard", () => {
  it("trang chủ của ORG_OWNER là /org, của SYSTEM_ADMIN vẫn là /admin", () => {
    expect(getRoleHomeRoute("ORG_OWNER")).toBe("/org");
    expect(getRoleHomeRoute("SYSTEM_ADMIN")).toBe("/admin");
  });

  it("ORG_OWNER vào được, thấy nội dung và menu Thành viên / Lớp học", async () => {
    useAuthStore.getState().setSessionStatus("authenticated");
    useAuthStore.getState().setActiveRole("ORG_OWNER");
    useAuthStore.getState().setActiveOrg({ id: "org-1", name: "Trường ABC" });

    renderLayout();

    await screen.findByText("NOI DUNG TO CHUC");
    const nav = screen.getAllByRole("navigation", { name: "Menu tổ chức" })[0];
    expect(within(nav).getByRole("link", { name: /Thành viên/ }).getAttribute("href")).toBe("/org/members");
    expect(within(nav).getByRole("link", { name: /Lớp học/ }).getAttribute("href")).toBe("/org/classes");
    expect(screen.getAllByText("Trường ABC").length).toBeGreaterThan(0);
  });

  it.each(["SYSTEM_ADMIN", "STUDENT", "TEACHER"])("%s KHÔNG vào được khu /org", async (role) => {
    useAuthStore.getState().setSessionStatus("authenticated");
    useAuthStore.getState().setActiveRole(role);

    renderLayout();

    await waitFor(() => {
      expect(screen.queryByText("NOI DUNG TO CHUC")).toBeNull();
    });
  });
});
