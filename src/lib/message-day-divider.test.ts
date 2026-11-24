import { describe, expect, it } from "vitest";
import { dayDividerLabels, messageDayKey, messageDayLabel } from "./message-day-divider";

const NOW = new Date(2026, 10, 24, 14, 0); // 24/11/2026 14:00 địa phương
const local = (m: number, d: number, h: number, min = 0, y = 2026) => new Date(y, m - 1, d, h, min).toISOString();

describe("messageDayLabel", () => {
  it("hôm nay, hôm qua, còn lại dd/MM/yyyy", () => {
    expect(messageDayLabel(local(11, 24, 0, 5), NOW)).toBe("Hôm nay");
    expect(messageDayLabel(local(11, 23, 23, 55), NOW)).toBe("Hôm qua");
    expect(messageDayLabel(local(10, 8, 15, 31), NOW)).toBe("08/10/2026");
  });
});

describe("dayDividerLabels", () => {
  it("chỉ tin đầu của mỗi ngày có nhãn; tin cũ lẫn tin hôm nay được ngăn ra", () => {
    const labels = dayDividerLabels(
      [local(10, 8, 15, 31), local(10, 8, 15, 32), local(11, 24, 11, 51), local(11, 24, 11, 52)],
      NOW
    );
    expect(labels).toEqual(["08/10/2026", null, "Hôm nay", null]);
  });

  it("tin lạc thứ tự (tin tạm/realtime) không sinh vạch thứ hai cho cùng một ngày", () => {
    const labels = dayDividerLabels(
      [local(11, 24, 9), local(11, 23, 20), local(11, 24, 10), local(11, 24, 11)],
      NOW
    );
    expect(labels).toEqual(["Hôm nay", "Hôm qua", null, null]);
  });

  it("mốc thời gian hỏng không chèn vạch và không làm hỏng ngày sau", () => {
    expect(dayDividerLabels(["không phải ngày", local(11, 24, 9)], NOW)).toEqual([null, "Hôm nay"]);
    expect(messageDayKey("không phải ngày")).toBeNull();
  });

  it("danh sách rỗng", () => {
    expect(dayDividerLabels([], NOW)).toEqual([]);
  });
});
