/**
 * QA6 S6-09: tiêu đề voucher in "Giảm 50.000đ" / "tối đa 200.000đ" (chữ đ) trong khi cả app dùng "₫".
 * Mọi số tiền trong nhãn voucher phải đi qua `formatCurrency` (một ký hiệu tiền duy nhất).
 */
import { describe, expect, it } from "vitest";
import { formatCurrency } from "@/lib/utils";
import { formatVoucherDiscountLabel, type Voucher } from "./voucher.service";

const base = { id: "v1", code: "X", name: "X", is_active: true } as const;

describe("formatVoucherDiscountLabel — một ký hiệu tiền", () => {
  it("giảm số tiền cố định", () => {
    const v = { ...base, discount_unit: "MONEY", discount_method: "FIXED", discount_amount_money: 50000 } as Voucher;
    expect(formatVoucherDiscountLabel(v)).toBe(`Giảm ${formatCurrency(50000)}`);
    expect(formatVoucherDiscountLabel(v)).toContain("₫");
    expect(formatVoucherDiscountLabel(v)).not.toMatch(/\dđ/);
  });

  it("giảm phần trăm có trần", () => {
    const v = { ...base, discount_unit: "MONEY", discount_method: "PERCENT", discount_percent: 10, max_discount_money: 200000 } as Voucher;
    expect(formatVoucherDiscountLabel(v)).toBe(`Giảm 10% (tối đa ${formatCurrency(200000)})`);
  });

  it("giảm theo điểm giữ nguyên chữ 'điểm'", () => {
    const v = { ...base, discount_unit: "POINT", discount_method: "FIXED", discount_amount_points: 3000 } as Voucher;
    expect(formatVoucherDiscountLabel(v)).toBe("Giảm 3.000 điểm");
  });

  // QA8-A06: voucher điểm + phần trăm từng ra "Giảm 0 điểm" vì nhãn bỏ qua discount_method.
  it("QA8-A06: điểm theo phần trăm có phần trăm và trần điểm", () => {
    const v = { ...base, discount_unit: "POINT", discount_method: "PERCENT", discount_percent: 10, max_discount_points: 50 } as Voucher;
    expect(formatVoucherDiscountLabel(v)).toBe("Giảm 10% (tối đa 50 điểm)");
  });

  it("QA8-A06: điểm theo phần trăm không trần thì không in 'tối đa'", () => {
    const v = { ...base, discount_unit: "POINT", discount_method: "PERCENT", discount_percent: 10 } as Voucher;
    expect(formatVoucherDiscountLabel(v)).toBe("Giảm 10%");
  });

  // QA8-A07: dấu phẩy thập phân vi-VN, như trang báo cáo.
  it("QA8-A07: 12,5% dùng dấu phẩy", () => {
    const v = { ...base, discount_unit: "MONEY", discount_method: "PERCENT", discount_percent: 12.5, max_discount_money: 20000 } as Voucher;
    expect(formatVoucherDiscountLabel(v)).toBe(`Giảm 12,5% (tối đa ${formatCurrency(20000)})`);
  });
});
