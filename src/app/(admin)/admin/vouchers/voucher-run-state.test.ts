/** QA-C-14: voucher quá end_date (BACKTOSCHOOL30, hết hạn 16/09/2026) từng hiện như đang chạy. */
import { describe, expect, it } from "vitest";
import { VOUCHER_RUN_STATE_LABEL, voucherRunState } from "./voucher-form-model";

const NOW = new Date("2026-11-10T12:00:00+07:00").getTime();
const on = { is_active: true, start_date: "2026-09-01T00:00:00+07:00", end_date: "2026-12-31T23:59:00+07:00" };

describe("voucherRunState", () => {
  it("bật nhưng đã quá end_date: Hết hạn", () => {
    const state = voucherRunState({ ...on, end_date: "2026-09-16T23:59:00+07:00" }, NOW);
    expect(state).toBe("expired");
    expect(VOUCHER_RUN_STATE_LABEL[state]).toBe("Hết hạn");
  });

  it("tắt tay thắng mọi trạng thái khác", () => {
    expect(voucherRunState({ ...on, is_active: false, end_date: "2026-09-16T00:00:00+07:00" }, NOW)).toBe("disabled");
  });

  it("chưa tới start_date: Chưa tới ngày áp dụng; dùng hết lượt: Hết lượt dùng", () => {
    expect(voucherRunState({ ...on, start_date: "2026-12-01T00:00:00+07:00" }, NOW)).toBe("scheduled");
    expect(voucherRunState({ ...on, usage_limit: 5, used_count: 5 }, NOW)).toBe("exhausted");
  });

  it("trong hạn, không giới hạn lượt (usage_limit 0): Đang chạy", () => {
    expect(voucherRunState({ ...on, usage_limit: 0, used_count: 99 }, NOW)).toBe("running");
    expect(voucherRunState({ is_active: true }, NOW)).toBe("running");
  });
});
