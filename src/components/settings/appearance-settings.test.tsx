/**
 * QA3 Q13: Giao diện hiện mã "vi" thay vì "Tiếng Việt", nhãn "Bình thường" lệch vị trí 100% của thanh cỡ chữ.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppearanceSettings } from "./appearance-settings";

describe("AppearanceSettings (Q13)", () => {
  it("ô ngôn ngữ hiện nhãn 'Tiếng Việt', không phải mã 'vi'", () => {
    render(<AppearanceSettings initialLanguage="vi" />);
    const trigger = screen.getByRole("button", { name: "Ngôn ngữ hiển thị" });
    expect(trigger.textContent).toContain("Tiếng Việt");
    expect(trigger.textContent).not.toMatch(/^vi$/);
  });

  it("ngôn ngữ English hiện nhãn English", () => {
    render(<AppearanceSettings initialLanguage="en" />);
    expect(screen.getByRole("button", { name: "Ngôn ngữ hiển thị" }).textContent).toContain("English");
  });

  it("nhãn 'Bình thường' nằm đúng vị trí 100% trên thang 80-150 (≈28.57%), không phải giữa thanh", () => {
    render(<AppearanceSettings />);
    const normal = screen.getByTestId("font-scale-normal");
    const left = parseFloat(normal.style.left);
    expect(left).toBeCloseTo(((100 - 80) / (150 - 80)) * 100, 1);
    expect(left).not.toBe(50);
  });
});
