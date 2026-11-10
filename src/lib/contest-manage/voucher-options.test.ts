/** QA-C-22: không cho gắn voucher hết hạn trước ngày kết thúc cuộc thi làm giải. */
import { describe, expect, it } from "vitest";
import { buildContestVoucherOptions } from "./voucher-options";

const END = "2026-11-25T21:00:00+07:00";
const EXPIRED = { id: "v1", name: "Mùa tựu trường - giảm 30%", code: "BACKTOSCHOOL30", end_date: "2026-09-16T06:23:00+07:00" };
const VALID = { id: "v2", name: "Ưu đãi VIP", code: "VIP100", end_date: "2026-12-18T22:59:00+07:00" };
const NO_END = { id: "v3", name: "Không hạn", code: "FOREVER", end_date: null };
const ENDS_MID = { id: "v4", name: "Giữa kỳ", code: "MID", end_date: "2026-11-25T10:00:00+07:00" };

describe("buildContestVoucherOptions", () => {
  it("voucher hết hạn trước khi cuộc thi kết thúc bị khoá kèm nhãn 'Hết hạn'", () => {
    const opts = buildContestVoucherOptions([EXPIRED, VALID, NO_END, ENDS_MID], END, []);
    const byId = Object.fromEntries(opts.map((o) => [o.id, o]));
    expect(byId.v1.disabled).toBe(true);
    expect(byId.v1.label).toContain("Hết hạn 06:23 16/09/2026");
    expect(byId.v4.disabled).toBe(true); // hết hạn trong ngày thi nhưng trước giờ kết thúc
    expect(byId.v2.disabled).toBeUndefined();
    expect(byId.v3.disabled).toBeUndefined();
  });

  it("voucher đang gắn nhưng đã tắt vẫn hiện (chọn được để admin đổi), không nhân đôi voucher đã có", () => {
    const opts = buildContestVoucherOptions([VALID], END, [VALID, { id: "v9", name: "Cũ", code: "OLD" }]);
    expect(opts.map((o) => o.id)).toEqual(["v2", "v9"]);
    expect(opts[1].label).toContain("không còn hoạt động");
  });

  it("thiếu ngày kết thúc cuộc thi: không khoá voucher nào (không đoán)", () => {
    expect(buildContestVoucherOptions([EXPIRED], null, [])[0].disabled).toBeUndefined();
  });
});
