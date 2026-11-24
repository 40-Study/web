/**
 * Q6-T05: danh sách học viên truyền `bg-primary-100 text-primary-700` qua className, nhưng className chỉ áp lên khung
 * ngoài nên hiện ô vuông xanh nhạt sau hình tròn vẫn `bg-primary-500`. Màu phải nằm trên chính hình tròn.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./avatar";

function parts(fallback: string) {
  const letter = screen.getByText(fallback.slice(0, 2));
  const circle = letter.parentElement as HTMLElement;
  const wrapper = circle.parentElement as HTMLElement;
  return { letter, circle, wrapper };
}

describe("Avatar tone (Q6-T05)", () => {
  it('tone="soft": nền nhạt nằm trên hình tròn, khung ngoài không bị tô màu', () => {
    render(<Avatar fallback="Lan" size="sm" tone="soft" />);
    const { circle, wrapper } = parts("La");
    expect(circle.className).toContain("rounded-full");
    expect(circle.className).toContain("bg-primary-100");
    expect(circle.className).toContain("text-primary-700");
    expect(circle.className).not.toContain("bg-primary-500");
    expect(wrapper.className).not.toMatch(/\bbg-/);
  });

  it("mặc định giữ nền đậm chữ trắng như trước", () => {
    render(<Avatar fallback="Minh" />);
    const { circle } = parts("Mi");
    expect(circle.className).toContain("bg-primary-500");
    expect(circle.className).toContain("text-white");
  });

  it("className vẫn chỉ là bố cục của khung ngoài (kích thước, viền), không đụng tới màu hình tròn", () => {
    render(<Avatar fallback="Hoa" className="w-20 h-20 ring-4" />);
    const { circle, wrapper } = parts("Ho");
    expect(wrapper.className).toContain("ring-4");
    expect(circle.className).toContain("bg-primary-500");
  });
});
