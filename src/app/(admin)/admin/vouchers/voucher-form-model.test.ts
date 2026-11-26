import { describe, expect, it } from "vitest";
import type { Voucher } from "@/services/voucher.service";
import {
  buildCreateVoucherPayload,
  buildUpdateVoucherPayload,
  emptyVoucherForm,
  voucherToForm,
  voucherValidityText,
  VOUCHER_CODE_FORMAT_ERROR,
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

  // L6 mục 8: sửa voucher, ô ngày và trần giảm để trống nghĩa là XOÁ => gửi null; tạo mới thì bỏ trống = không gửi.
  it("sửa: ô ngày bắt đầu/kết thúc trống gửi null; có giá trị thì gửi ISO", () => {
    const cleared = buildUpdateVoucherPayload(base({ start_date: "", end_date: "" }));
    expect(cleared.payload).toHaveProperty("start_date", null);
    expect(cleared.payload).toHaveProperty("end_date", null);
    const kept = buildUpdateVoucherPayload(base({ start_date: "2026-10-01T10:00", end_date: "2026-12-31T10:00" }));
    expect(typeof kept.payload?.start_date).toBe("string");
    expect(typeof kept.payload?.end_date).toBe("string");
  });

  it("sửa PERCENT: trần giảm trống gửi null theo đơn vị; có giá trị thì gửi số; FIXED không gửi trần", () => {
    const money = buildUpdateVoucherPayload(base({ discount_method: "PERCENT", discount_percent: "10", max_discount: "" }));
    expect(money.payload).toHaveProperty("max_discount_money", null);
    expect(money.payload).not.toHaveProperty("max_discount_points");
    const point = buildUpdateVoucherPayload(base({ discount_unit: "POINT", discount_method: "PERCENT", discount_percent: "10", max_discount: "" }));
    expect(point.payload).toHaveProperty("max_discount_points", null);
    const kept = buildUpdateVoucherPayload(base({ discount_method: "PERCENT", discount_percent: "10", max_discount: "30000" }));
    expect(kept.payload).toHaveProperty("max_discount_money", 30000);
    const fixed = buildUpdateVoucherPayload(base());
    expect(fixed.payload).not.toHaveProperty("max_discount_money");
    expect(fixed.payload).not.toHaveProperty("max_discount_points");
  });

  it("tạo mới: ô ngày và trần để trống thì KHÔNG gửi (không phải null)", () => {
    const res = buildCreateVoucherPayload(base({ discount_method: "PERCENT", discount_percent: "10", max_discount: "" }));
    expect(res.payload).not.toHaveProperty("start_date");
    expect(res.payload).not.toHaveProperty("end_date");
    expect(res.payload).not.toHaveProperty("max_discount_money");
  });
});

describe("voucher-form-model (F-02: first_order_only)", () => {
  it("mặc định tắt và GỬI first_order_only=false tường minh khi tạo", () => {
    expect(emptyVoucherForm.first_order_only).toBe(false);
    expect(buildCreateVoucherPayload(base()).payload).toHaveProperty("first_order_only", false);
  });

  it("bật thì tạo và sửa đều gửi first_order_only=true; tắt đi khi sửa gửi false (không để backend giữ giá trị cũ)", () => {
    expect(buildCreateVoucherPayload(base({ first_order_only: true })).payload).toHaveProperty("first_order_only", true);
    expect(buildUpdateVoucherPayload(base({ first_order_only: true })).payload).toHaveProperty("first_order_only", true);
    expect(buildUpdateVoucherPayload(base({ first_order_only: false })).payload).toHaveProperty("first_order_only", false);
  });

  it("voucherToForm điền từ voucher; thiếu field thì coi như tắt", () => {
    const v = {
      id: "v1", code: "NEW1", name: "Mới", discount_unit: "MONEY", discount_method: "FIXED",
      discount_amount_money: 50000, is_active: true, first_order_only: true, usage_limit: 0, usage_per_user: 1,
    } as unknown as Voucher;
    expect(voucherToForm(v).first_order_only).toBe(true);
    expect(voucherToForm({ ...v, first_order_only: undefined }).first_order_only).toBe(false);
  });
});

describe("QA3-11: định dạng mã voucher và dòng hiệu lực", () => {
  it.each(["qa3 test!", "GIAM 50K", "giảm50k", "A.B", "ab/cd"])("tạo với mã %j bị chặn bằng câu tiếng Việt", (code) => {
    const res = buildCreateVoucherPayload(base({ code }));
    expect(res.payload).toBeUndefined();
    expect(res.error).toBe(VOUCHER_CODE_FORMAT_ERROR);
  });

  it.each(["giam50k", "GIAM-50K", "VIP_2026", "qa3test261104"])("mã %j hợp lệ, gửi lên đã viết hoa", (code) => {
    const res = buildCreateVoucherPayload(base({ code }));
    expect(res.error).toBeUndefined();
    expect(res.payload?.code).toBe(code.toUpperCase());
  });

  it("sửa voucher cũ có mã lạ vẫn lưu được (mã không đổi được nên không kiểm lại)", () => {
    expect(buildUpdateVoucherPayload(base({ code: "QA3 TEST!" })).error).toBeUndefined();
  });

  it("voucherValidityText nêu ngày bắt đầu/kết thúc theo giờ VN hoặc 'không giới hạn'", () => {
    expect(voucherValidityText({ start_date: "2026-10-01T03:00:00Z", end_date: "2026-12-31T03:00:00Z" })).toBe(
      "Hiệu lực: 01/10/2026 10:00 – 31/12/2026 10:00",
    );
    expect(voucherValidityText({ start_date: "2026-10-01T03:00:00Z", end_date: null })).toMatch(/^Hiệu lực: từ 01\/10\/2026 10:00/);
    expect(voucherValidityText({ start_date: null, end_date: "2026-12-31T03:00:00Z" })).toBe("Hiệu lực: đến 31/12/2026 10:00");
    expect(voucherValidityText({})).toBe("Hiệu lực: không giới hạn thời gian");
  });
});

// QA6-A05: backend nhận điểm/lượt dạng int32 và tên <= 255; web phải chặn tại form với câu nói đúng trường,
// không để mọi 400 cùng hiện một câu chung. VND không có đơn vị lẻ, điểm và lượt là số nguyên.
describe("voucher-form-model — QA6-A05 số nguyên và giới hạn", () => {
  const error = (over: Partial<VoucherFormState>) => buildCreateVoucherPayload(base(over)).error;

  it.each([
    ["số tiền giảm lẻ", { discount_amount: "1.5" }, /Số tiền giảm \(VND\) phải là số nguyên/],
    ["số điểm giảm lẻ", { discount_unit: "POINT" as const, discount_amount: "1.5" }, /Số điểm giảm phải là số nguyên/],
    ["đơn tối thiểu lẻ", { min_purchase_money: "1000.5" }, /Đơn tối thiểu \(VND\) phải là số nguyên/],
    ["tổng lượt lẻ", { usage_limit: "2.5" }, /Tổng số lượt dùng phải là số nguyên/],
    ["lượt mỗi người lẻ", { usage_per_user: "0.5" }, /Số lượt mỗi người phải là số nguyên/],
    ["trần giảm lẻ (phần trăm, tiền)", { discount_method: "PERCENT" as const, discount_percent: "10", max_discount: "100.5" }, /Mức giảm tối đa phải là số nguyên/],
  ])("%s -> báo lỗi đúng trường, không tạo payload", (_name, over, message) => {
    expect(error(over)).toMatch(message);
    expect(buildCreateVoucherPayload(base(over)).payload).toBeUndefined();
  });

  it.each([
    ["tổng lượt 3 tỷ (vượt int32)", { usage_limit: "3000000000" }, /Tổng số lượt dùng tối đa 2\.147\.483\.647/],
    ["lượt mỗi người vượt int32", { usage_per_user: "2147483648" }, /Số lượt mỗi người tối đa/],
    ["điểm giảm vượt int32", { discount_unit: "POINT" as const, discount_amount: "2147483648" }, /Số điểm giảm tối đa/],
  ])("%s -> báo ngưỡng int32", (_name, over, message) => {
    expect(error(over)).toMatch(message);
  });

  it("đúng ngưỡng int32 vẫn hợp lệ", () => {
    expect(error({ usage_limit: "2147483647" })).toBeUndefined();
  });

  it("số tiền VND lớn hơn int32 vẫn hợp lệ (backend lưu tiền dạng float64)", () => {
    expect(error({ discount_amount: "3000000000" })).toBeUndefined();
  });

  it("tên 256 ký tự bị chặn, 255 ký tự qua", () => {
    expect(error({ name: "a".repeat(256) })).toBe("Tên voucher tối đa 255 ký tự.");
    expect(error({ name: "a".repeat(255) })).toBeUndefined();
  });

  it("sửa voucher cũng áp cùng luật (số lẻ bị chặn)", () => {
    const res = buildUpdateVoucherPayload(base({ discount_amount: "2.5" }));
    expect(res.error).toMatch(/phải là số nguyên/);
  });
});
