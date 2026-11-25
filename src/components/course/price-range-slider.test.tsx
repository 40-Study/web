/**
 * QA6 S6-10: bộ lọc giá hiện "2.0tr" (chấm thập phân kiểu Anh). Tròn triệu thì "2tr", lẻ thì dấu phẩy Việt.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PriceRangeSlider, formatPrice } from "./price-range-slider";

describe("formatPrice", () => {
  it("tròn triệu không có phần thập phân", () => {
    expect(formatPrice(2_000_000)).toBe("2tr");
    expect(formatPrice(1_000_000)).toBe("1tr");
  });

  it("lẻ triệu dùng dấu phẩy", () => {
    expect(formatPrice(1_500_000)).toBe("1,5tr");
    expect(formatPrice(2_550_000)).toBe("2,55tr");
  });

  it("dưới một triệu và miễn phí giữ nguyên", () => {
    expect(formatPrice(250_000)).toBe("250k");
    expect(formatPrice(0)).toBe("Miễn phí");
  });
});

describe("PriceRangeSlider", () => {
  it("nhãn khoảng giá không còn '.0tr'", () => {
    const { container } = render(<PriceRangeSlider min={0} max={5_000_000} value={[0, 2_000_000]} onChange={() => {}} />);
    expect(container.textContent).toContain("2tr");
    expect(container.textContent).not.toMatch(/\.0tr/);
    expect(screen.getAllByRole("slider").length).toBe(2);
  });
});
