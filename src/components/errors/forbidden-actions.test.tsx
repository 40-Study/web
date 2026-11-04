/**
 * Q3-05: trang 403 từng là ngõ cụt — "Về trang chủ" trỏ "/" rồi bị đưa về /403 lần nữa, không có đăng xuất/đổi vai.
 */

import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const logoutMutate = vi.fn();
vi.mock("@/hooks/queries/use-auth", () => ({
  useLogout: () => ({ mutate: logoutMutate, isPending: false }),
  useSwitchRole: () => ({ mutate: vi.fn(), isPending: false }),
  useMyRoles: () => ({ data: undefined }),
}));

import { ForbiddenActions } from "./forbidden-actions";
import { useAuthStore } from "@/stores/auth.store";
import { renderWithProviders } from "@/test/utils";
import type { UnifiedRole } from "@/services/auth.service";

const TEACHER: UnifiedRole = { id: "sr-t", type: "system", role_name: "TEACHER", display_name: "TEACHER" };
const STUDENT: UnifiedRole = { id: "sr-s", type: "system", role_name: "STUDENT", display_name: "STUDENT" };
const QA3: UnifiedRole = {
  id: "r-qa3",
  type: "organization",
  role_name: "QA3_TEACHER",
  display_name: "QA3_TEACHER - ABC",
  organization_id: "org-1",
  organization_name: "ABC",
};

function setAuth(activeRole: string | null, roles: UnifiedRole[], isAuthenticated = true) {
  useAuthStore.setState({ isAuthenticated, hasHydrated: true, activeRole, roles, activeUnifiedRole: null });
}

beforeEach(() => {
  logoutMutate.mockReset();
  setAuth(null, [], false);
});

describe("ForbiddenActions", () => {
  it("giảng viên: 'Về trang chủ' trỏ khu giảng viên, không phải '/' (vòng lặp 403)", () => {
    setAuth("TEACHER", [TEACHER, STUDENT]);
    renderWithProviders(<ForbiddenActions />);
    expect(screen.getByRole("link", { name: "Về trang chủ" }).getAttribute("href")).toBe("/teacher/schedule");
  });

  it("vai tuỳ biến QA3_TEACHER: về khu giảng viên và store được ghi vai hệ thống TEACHER", () => {
    setAuth("QA3_TEACHER", [TEACHER, QA3]);
    renderWithProviders(<ForbiddenActions />);
    expect(screen.getByRole("link", { name: "Về trang chủ" }).getAttribute("href")).toBe("/teacher/schedule");
    expect(useAuthStore.getState().activeRole).toBe("TEACHER");
  });

  it("đã đăng nhập: có Đăng xuất và chuyển vai trò (chỉ vai có khu vực, không có QA3_TEACHER)", () => {
    setAuth("TEACHER", [TEACHER, STUDENT, QA3]);
    renderWithProviders(<ForbiddenActions />);
    expect(screen.getByRole("button", { name: /Học viên/ })).toBeTruthy();
    expect(screen.queryByText(/QA3_TEACHER/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Đăng xuất/ }));
    expect(logoutMutate).toHaveBeenCalledTimes(1);
  });

  it("khách: chỉ có 'Về trang chủ' -> '/', không có Đăng xuất", () => {
    renderWithProviders(<ForbiddenActions />);
    expect(screen.getByRole("link", { name: "Về trang chủ" }).getAttribute("href")).toBe("/");
    expect(screen.queryByRole("button", { name: /Đăng xuất/ })).toBeNull();
  });
});
