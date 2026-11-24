import { describe, expect, it } from "vitest";
import { coinBonusLabel } from "./coin-package-label";

const fmt = (n: number) => n.toLocaleString("vi-VN");

describe("coinBonusLabel (QA5 S20)", () => {
  it("gói có xu tặng: nêu số xu tặng", () => {
    expect(coinBonusLabel(1500, fmt)).toBe("Tặng thêm 1.500 xu");
  });

  it("gói không xu tặng: không dùng chữ 'tiêu chuẩn' dễ lẫn với tên gói khác", () => {
    const label = coinBonusLabel(0, fmt);
    expect(label).toBe("Không kèm xu tặng");
    expect(label.toLowerCase()).not.toContain("tiêu chuẩn");
  });
});
