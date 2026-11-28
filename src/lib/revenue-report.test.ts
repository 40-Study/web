import { describe, expect, it } from "vitest";
import { revenueReportRange, successRateHint, successRateValue } from "./revenue-report";

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
    expect(successRateValue({ success_rate: 80, by_status: { completed: 4, failed: 1 } })).toBe("80,0%");
    expect(successRateValue({ success_rate: 0, by_status: { failed: 2 } })).toBe("0,0%");
  });

  it("QA7-A07: dấu phẩy thập phân vi-VN, không phải dấu chấm (23,1% chứ không phải 23.1%)", () => {
    expect(successRateValue({ success_rate: (3 / 13) * 100, by_status: { completed: 3, failed: 10 } })).toBe("23,1%");
  });
});

describe("revenueReportRange — khoảng theo ngày, khoá query lặp lại (Q11-ADMIN-01)", () => {
  it("hai thời điểm khác nhau trong CÙNG ngày cho cùng from/to (khoá cache lặp lại giữa các lần mount)", () => {
    const morning = new Date(2026, 10, 27, 8, 5, 3, 120);
    const evening = new Date(2026, 10, 27, 22, 41, 59, 900);
    expect(revenueReportRange("30days", morning)).toEqual(revenueReportRange("30days", evening));
  });

  it("sang ngày khác thì khoảng đổi (không dính cache của hôm qua)", () => {
    const a = revenueReportRange("7days", new Date(2026, 10, 27, 10));
    const b = revenueReportRange("7days", new Date(2026, 10, 28, 10));
    expect(a).not.toEqual(b);
  });

  it("N ngày dương lịch gồm cả hôm nay: 7 ngày = từ 00:00 ngày 21/11 đến 23:59:59.999 ngày 27/11", () => {
    const { from, to } = revenueReportRange("7days", new Date(2026, 10, 27, 15, 30));
    expect(new Date(from).getTime()).toBe(new Date(2026, 10, 21, 0, 0, 0, 0).getTime());
    expect(new Date(to).getTime()).toBe(new Date(2026, 10, 27, 23, 59, 59, 999).getTime());
  });

  it("bộ lọc 30 và 90 ngày", () => {
    const now = new Date(2026, 10, 27, 12);
    expect(new Date(revenueReportRange("30days", now).from).getTime()).toBe(new Date(2026, 9, 29).getTime());
    expect(new Date(revenueReportRange("90days", now).from).getTime()).toBe(new Date(2026, 7, 30).getTime());
  });
});
