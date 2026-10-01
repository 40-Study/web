import { describe, expect, it } from "vitest";
import type { Voucher } from "@/services/voucher.service";
import {
  buildCreateVoucherPayload,
  buildUpdateVoucherPayload,
  emptyVoucherForm,
  voucherToForm,
  type VoucherFormState,
} from "./voucher-form-model";

const base = (over: Partial<VoucherFormState> = {}): VoucherFormState => ({
  ...emptyVoucherForm,
  code: "giam50k",
  name: "Giảm 50k",
  discount_amount: "50000",
  ...over,
});

describe("voucher-form-model (L1: holders_only)", () => {
  it("mặc định công khai và GỬI holders_only=false tường minh khi tạo", () => {
    const res = buildCreateVoucherPayload(base());
    expect(res.error).toBeUndefined();
    expect(res.payload).toHaveProperty("holders_only", false);
    expect(res.payload?.code).toBe("GIAM50K");
    expect(res.payload?.discount_amount_money).toBe(50000);
  });

  it("bật Dành riêng thì tạo gửi holders_only=true", () => {
    const res = buildCreateVoucherPayload(base({ holders_only: true }));
    expect(res.payload).toHaveProperty("holders_only", true);
  });

  it("sửa gửi holders_only theo form (cả khi tắt đi) và không gửi mã/loại giảm", () => {
    const on = buildUpdateVoucherPayload(base({ holders_only: true }));
    const off = buildUpdateVoucherPayload(base({ holders_only: false }));
    expect(on.payload).toHaveProperty("holders_only", true);
    expect(off.payload).toHaveProperty("holders_only", false);
    expect(on.payload).not.toHaveProperty("code");
    expect(on.payload).not.toHaveProperty("discount_unit");
    expect(on.payload).not.toHaveProperty("discount_method");
  });

  it("voucherToForm điền holders_only từ voucher; thiếu field thì coi như công khai", () => {
    const v = {
      id: "v1", code: "VIP", name: "Voucher VIP", discount_unit: "MONEY", discount_method: "FIXED",
      discount_amount_money: 50000, is_active: true, holders_only: true, usage_limit: 0, usage_per_user: 1,
    } as Voucher;
    expect(voucherToForm(v).holders_only).toBe(true);
    expect(voucherToForm({ ...v, holders_only: undefined }).holders_only).toBe(false);
    expect(voucherToForm(v).discount_amount).toBe("50000");
  });

  it("PERCENT: gửi phần trăm và trần theo đơn vị; POINT dùng trần điểm", () => {
    const money = buildCreateVoucherPayload(base({ discount_method: "PERCENT", discount_percent: "10", max_discount: "30000" }));
    expect(money.payload).toMatchObject({ discount_percent: 10, max_discount_money: 30000 });
    expect(money.payload).not.toHaveProperty("discount_amount_money");
    const point = buildCreateVoucherPayload(base({ discount_unit: "POINT", discount_method: "PERCENT", discount_percent: "10", max_discount: "5" }));
    expect(point.payload).toMatchObject({ discount_percent: 10, max_discount_points: 5 });
  });

  it.each([
    ["mã quá ngắn", { code: "ab" }],
    ["tên quá ngắn", { name: "ab" }],
    ["số tiền giảm bằng 0", { discount_amount: "0" }],
    ["số tiền giảm trống", { discount_amount: "" }],
    ["phần trăm trên 100", { discount_method: "PERCENT" as const, discount_percent: "101" }],
    ["phần trăm bằng 0", { discount_method: "PERCENT" as const, discount_percent: "0" }],
    ["lượt dùng âm", { usage_limit: "-1" }],
    ["kết thúc trước bắt đầu", { start_date: "2026-10-05T10:00", end_date: "2026-10-04T10:00" }],
  ])("từ chối khi %s", (_name, over) => {
    expect(buildCreateVoucherPayload(base(over)).error).toBeTruthy();
  });
});
