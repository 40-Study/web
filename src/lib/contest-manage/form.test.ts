/**
 * Validate form cuộc thi — phản chiếu luật backend `contest_validation.go`:
 * lịch (start > now, end > start + duration) và cơ cấu giải (khoảng 1..100, không chồng nhau,
 * ≤ 10 giải, mỗi giải có chứng nhận hoặc voucher, giảng viên không gắn voucher).
 */

import { describe, expect, it } from "vitest";

import {
  emptyContestForm,
  toUpsertRequest,
  validateContestForm,
  validatePrizes,
  type ContestFormValues,
  type PrizeDraft,
} from "./form";

const NOW = new Date("2026-10-01T08:00:00");

function form(overrides: Partial<ContestFormValues> = {}): ContestFormValues {
  return {
    ...emptyContestForm(),
    title: "QA-contest Toán nhanh",
    quiz_id: "quiz-1",
    start_time: "2026-10-01T09:00",
    end_time: "2026-10-01T10:00",
    duration_minutes: "30",
    ...overrides,
  };
}

function prize(from: number, to: number, extra: Partial<PrizeDraft> = {}): PrizeDraft {
  return { rank_from: String(from), rank_to: String(to), grant_certificate: true, voucher_id: null, ...extra };
}

describe("validateContestForm — lịch", () => {
  it("form hợp lệ không có lỗi", () => {
    expect(validateContestForm(form(), NOW, { allowVoucher: false })).toEqual({});
  });

  it("giờ bắt đầu ở quá khứ hoặc đúng bây giờ → lỗi start_time", () => {
    const past = validateContestForm(form({ start_time: "2026-10-01T07:59" }), NOW, { allowVoucher: false });
    expect(past.start_time).toBe("Giờ bắt đầu phải ở tương lai.");
    const exactlyNow = validateContestForm(form({ start_time: "2026-10-01T08:00" }), NOW, { allowVoucher: false });
    expect(exactlyNow.start_time).toBe("Giờ bắt đầu phải ở tương lai.");
  });

  it("kết thúc phải SAU bắt đầu + thời lượng (bằng đúng mốc cũng là lỗi)", () => {
    const equal = validateContestForm(form({ end_time: "2026-10-01T09:30" }), NOW, { allowVoucher: false });
    expect(equal.end_time).toBe("Giờ kết thúc phải sau giờ bắt đầu cộng thời lượng làm bài.");
    const ok = validateContestForm(form({ end_time: "2026-10-01T09:31" }), NOW, { allowVoucher: false });
    expect(ok.end_time).toBeUndefined();
  });

  it("thiếu giờ, thời lượng ngoài 1..600, thiếu quiz, tên quá ngắn", () => {
    const errors = validateContestForm(
      form({ start_time: "", end_time: "", duration_minutes: "601", quiz_id: "", title: "A" }),
      NOW,
      { allowVoucher: false }
    );
    expect(errors.start_time).toBe("Chọn giờ bắt đầu.");
    expect(errors.end_time).toBe("Chọn giờ kết thúc.");
    expect(errors.duration_minutes).toMatch(/1 đến 600/);
    expect(errors.quiz_id).toBeDefined();
    expect(errors.title).toBeDefined();
  });

  it("ngưỡng chứng nhận ngoài 0..100 → lỗi", () => {
    const errors = validateContestForm(form({ certificate_min_percentage: "101" }), NOW, { allowVoucher: false });
    expect(errors.certificate_min_percentage).toBeDefined();
  });
});

describe("validatePrizes", () => {
  it("khoảng hạng chồng nhau bị từ chối kể cả khi nhập không theo thứ tự", () => {
    expect(validatePrizes([prize(4, 10), prize(1, 4)], false)).toBe(
      "Các khoảng hạng của giải không được chồng nhau."
    );
    expect(validatePrizes([prize(4, 10), prize(1, 3)], false)).toBeNull();
  });

  it("rank_to < rank_from, hạng > 100, hạng 0 đều lỗi", () => {
    expect(validatePrizes([prize(3, 2)], false)).toMatch(/lớn hơn hoặc bằng/);
    expect(validatePrizes([prize(1, 101)], false)).toMatch(/tối đa là 100/);
    expect(validatePrizes([prize(0, 1)], false)).toMatch(/bắt đầu từ 1/);
  });

  it("giải không có chứng nhận lẫn voucher là dòng rỗng → lỗi", () => {
    expect(validatePrizes([prize(1, 1, { grant_certificate: false })], true)).toMatch(/chứng nhận hoặc voucher/);
  });

  it("giảng viên không được gắn voucher, admin thì được", () => {
    const withVoucher = [prize(1, 1, { voucher_id: "v-1" })];
    expect(validatePrizes(withVoucher, false)).toMatch(/^Giải 1: .*Gỡ voucher/);
    expect(validatePrizes(withVoucher, true)).toBeNull();
  });

  it("tối đa 10 giải", () => {
    const eleven = Array.from({ length: 11 }, (_, i) => prize(i + 1, i + 1));
    expect(validatePrizes(eleven, true)).toBe("Tối đa 10 giải.");
  });
});

describe("toUpsertRequest", () => {
  it("đổi chuỗi form sang đúng kiểu request backend (số, ISO, null)", () => {
    const body = toUpsertRequest(
      form({ description: "  ", certificate_min_percentage: "80", prizes: [prize(1, 3)] })
    );
    expect(body.duration_minutes).toBe(30);
    expect(body.max_participants).toBe(0);
    expect(body.description).toBeNull();
    expect(body.certificate_min_percentage).toBe(80);
    expect(body.start_time).toBe(new Date("2026-10-01T09:00").toISOString());
    expect(body.prizes).toEqual([{ rank_from: 1, rank_to: 3, grant_certificate: true, voucher_id: null }]);
  });
});
