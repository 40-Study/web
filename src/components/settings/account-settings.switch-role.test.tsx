/**
 * Q6-PG-16: phụ huynh chỉ có một vai bấm "Chuyển" ra hộp thoại chỉ có đúng vai đang dùng -> ẩn hàng.
 * Q6-T10: cùng một tên "Chuyển vai trò" với menu avatar (trước đây "Chuyển tài khoản"); huy hiệu "Sắp ra mắt"
 * không bị bẻ dòng ở 390px.
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";
import { useAuthStore } from "@/stores/auth.store";
import { AccountSettings } from "./account-settings";

const PARENT = { id: "r1", type: "system" as const, role_name: "PARENT", display_name: "PARENT" };
const STUDENT = { id: "r2", type: "system" as const, role_name: "STUDENT", display_name: "STUDENT" };
const user = { email: "a@b.vn", has2FA: false };

function setRoles(roles: (typeof PARENT)[]) {
  useAuthStore.setState({ roles, activeRole: roles[0].role_name, activeUnifiedRole: roles[0] });
}

beforeEach(() => setRoles([PARENT]));

describe("AccountSettings — hàng chuyển vai trò", () => {
  it("một vai: không có hàng chuyển vai trò và không có nút 'Chuyển'", () => {
    renderWithQuery(<AccountSettings user={user} />);
    expect(screen.queryByText("Chuyển vai trò")).toBeNull();
    expect(screen.queryByRole("button", { name: "Chuyển" })).toBeNull();
  });

  it("từ hai vai: hàng tên 'Chuyển vai trò' (không còn 'Chuyển tài khoản')", () => {
    setRoles([PARENT, STUDENT]);
    renderWithQuery(<AccountSettings user={user} />);
    expect(screen.getByText("Chuyển vai trò")).toBeTruthy();
    expect(screen.queryByText("Chuyển tài khoản")).toBeNull();
    expect(screen.getByRole("button", { name: "Chuyển" })).toBeTruthy();
  });

  it("L1: một vai hệ thống + một vai tuỳ biến của tổ chức: không hiện hàng (cùng cách đếm với header)", () => {
    const orgCustom = { id: "r9", type: "organization" as const, role_name: "ORG_STUDENT", display_name: "ORG_STUDENT", organization_id: "o1", organization_name: "ABC" };
    useAuthStore.setState({ roles: [PARENT, orgCustom], activeRole: "PARENT", activeUnifiedRole: PARENT });
    renderWithQuery(<AccountSettings user={user} />);
    expect(screen.queryByText("Chuyển vai trò")).toBeNull();
    expect(screen.queryByRole("button", { name: "Chuyển" })).toBeNull();
  });

  it("huy hiệu 'Sắp ra mắt' không bị bẻ dòng", () => {
    renderWithQuery(<AccountSettings user={user} />);
    expect(screen.getByText("Sắp ra mắt").className).toContain("whitespace-nowrap");
  });
});
