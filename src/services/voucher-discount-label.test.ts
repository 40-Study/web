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
});
