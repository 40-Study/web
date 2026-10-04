import { describe, expect, it } from "vitest";
import { isAdminNavActive } from "./admin-nav";

describe("isAdminNavActive", () => {
  it("Tổng quan chỉ sáng ở /admin, không sáng ở trang con", () => {
    expect(isAdminNavActive("/admin", "/admin")).toBe(true);
    expect(isAdminNavActive("/admin/users", "/admin")).toBe(false);
    expect(isAdminNavActive("/admin/orders/abc", "/admin")).toBe(false);
  });

  it("mục khác sáng ở chính nó và ở trang con, không sáng ở mục anh em có chung tiền tố chữ", () => {
    expect(isAdminNavActive("/admin/orders", "/admin/orders")).toBe(true);
    expect(isAdminNavActive("/admin/orders/abc", "/admin/orders")).toBe(true);
    expect(isAdminNavActive("/admin/organizations", "/admin/orders")).toBe(false);
    expect(isAdminNavActive("/admin/users", "/admin/orders")).toBe(false);
  });
});