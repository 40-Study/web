import { describe, expect, it } from "vitest";
import { findActiveAdminNavItem, isAdminNavActive } from "./admin-nav";

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

describe("findActiveAdminNavItem", () => {
  const items = [
    { href: "/admin", label: "Tổng quan" },
    { href: "/admin/orders", label: "Đơn hàng" },
    { href: "/admin/organizations", label: "Tổ chức" },
  ];

  it("trả mục đang xem, kể cả ở trang con, và không nhầm mục anh em chung tiền tố chữ", () => {
    expect(findActiveAdminNavItem("/admin", items)?.label).toBe("Tổng quan");
    expect(findActiveAdminNavItem("/admin/orders/abc", items)?.label).toBe("Đơn hàng");
    expect(findActiveAdminNavItem("/admin/organizations", items)?.label).toBe("Tổ chức");
  });

  it("trả undefined khi trang không thuộc menu nào", () => {
    expect(findActiveAdminNavItem("/admin/khong-co", items)).toBeUndefined();
  });
});
