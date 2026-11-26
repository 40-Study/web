import { describe, expect, it } from "vitest";

import { adminMenu } from "./admin-menu";
import { filterByQuery, foldSearchText, matchesSearchQuery } from "./text-search";

const labels = (query: string) => filterByQuery(adminMenu, query).map((item) => item.label);

describe("foldSearchText", () => {
  it("bỏ dấu, đổi đ/Đ thành d, chữ thường, gộp khoảng trắng", () => {
    expect(foldSearchText("  Rút   TIỀN Đơn  ")).toBe("rut tien don");
  });
});

describe("filterByQuery — tìm không dấu trên menu admin", () => {
  it('gõ "rut tien" ra "Rút tiền giảng viên" đứng đầu', () => {
    expect(labels("rut tien")[0]).toBe("Rút tiền giảng viên");
  });

  it("không phân biệt hoa thường và có dấu hay không", () => {
    expect(labels("RÚT TIỀN")[0]).toBe("Rút tiền giảng viên");
    expect(labels("Rut Tien")[0]).toBe("Rút tiền giảng viên");
  });

  it('"don hang" khớp "Đơn hàng" (đ không tách được bằng NFD)', () => {
    expect(labels("don hang")).toContain("Đơn hàng");
  });

  it("khớp theo từ khoá phụ không hiện ra UI", () => {
    expect(labels("coupon")).toEqual(["Voucher"]);
  });

  it("mọi từ trong truy vấn đều phải khớp", () => {
    expect(labels("rut cuoc thi")).toEqual([]);
  });

  it("mục khớp ngay ở tên đứng trước mục chỉ khớp mô tả", () => {
    // "Cuộc thi" có "voucher" trong mô tả, "Voucher" có ngay ở tên.
    expect(labels("voucher")).toEqual(["Voucher", "Cuộc thi"]);
  });

  it("truy vấn rỗng trả toàn bộ, giữ thứ tự menu", () => {
    expect(labels("   ")).toEqual(adminMenu.map((item) => item.label));
  });
});

describe("matchesSearchQuery — ô tìm kiếm trang giảng viên (Q8-T01)", () => {
  it('"Le" khớp "Lê Văn C" và "nguoi moi" khớp "Người mới"', () => {
    expect(matchesSearchQuery("Le", "Lê Văn C")).toBe(true);
    expect(matchesSearchQuery("nguoi moi", "Python cho Người mới")).toBe(true);
  });

  it("khoảng trắng đầu/cuối không làm hỏng khớp", () => {
    expect(matchesSearchQuery("  git  ", "Học Git cơ bản")).toBe(true);
  });

  it("truy vấn rỗng khớp tất cả, trường null bị bỏ qua, không khớp thì false", () => {
    expect(matchesSearchQuery("   ", "x")).toBe(true);
    expect(matchesSearchQuery("abc", null, undefined, "xyz")).toBe(false);
    expect(matchesSearchQuery("abc", null, "ABC-1")).toBe(true);
  });
});
