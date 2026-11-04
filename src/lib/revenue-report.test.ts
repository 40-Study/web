import { describe, expect, it } from "vitest";
import { successRateHint, successRateValue } from "./revenue-report";

describe("successRateHint — mẫu số khớp phép tính backend (B-19)", () => {
  it("số liệu QA: 3 hoàn tất, 15 đơn trong kỳ nhưng mẫu số thật là 13 (23.1%)", () => {
    const hint = successRateHint({
      completed_count: 3,
      transaction_count: 15,
      by_status: { pending: 1, processing: 0, completed: 3, failed: 2, refunded: 1, cancelled: 6, expired: 2 },
    });
    expect(hint).toBe("3 hoàn tất / 13 đơn đã có kết quả (chưa tính 2 đơn đang chờ hoặc hoàn tiền)");
    // 3/13 = 23.1% — đúng con số hiển thị ở thẻ.
    expect(((3 / 13) * 100).toFixed(1)).toBe("23.1");
  });

  it("không có đơn nào bị loại thì không thêm phần ngoặc", () => {
    expect(
      successRateHint({ completed_count: 2, transaction_count: 4, by_status: { completed: 2, failed: 2 } })
    ).toBe("2 hoàn tất / 4 đơn đã có kết quả");
  });
});

describe("successRateValue — QA3-13: không in 0.0% trên mẫu số 0", () => {
  it("không có đơn nào đã có kết quả (chỉ chờ/đang xử lý/hoàn tiền hoặc không có đơn) → —", () => {
    expect(successRateValue({ success_rate: 0, by_status: {} })).toBe("—");
    expect(successRateValue({ success_rate: 0, by_status: { pending: 3, processing: 1, refunded: 2 } })).toBe("—");
  });

  it("có mẫu số thì giữ 1 chữ số thập phân, kể cả khi tỷ lệ thật sự là 0%", () => {
    expect(successRateValue({ success_rate: 80, by_status: { completed: 4, failed: 1 } })).toBe("80.0%");
    expect(successRateValue({ success_rate: 0, by_status: { failed: 2 } })).toBe("0.0%");
  });
});
