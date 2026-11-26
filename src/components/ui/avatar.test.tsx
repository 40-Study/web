/**
 * Q6-T05: danh sách học viên truyền `bg-primary-100 text-primary-700` qua className, nhưng className chỉ áp lên khung
 * ngoài nên hiện ô vuông xanh nhạt sau hình tròn vẫn `bg-primary-500`. Màu phải nằm trên chính hình tròn.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./avatar";

function parts(initials: string) {
  const letter = screen.getByText(initials);
  const circle = letter.parentElement as HTMLElement;
  const wrapper = circle.parentElement as HTMLElement;
  return { letter, circle, wrapper };
}

describe("Avatar tone (Q6-T05)", () => {
  it('tone="soft": nền nhạt nằm trên hình tròn, khung ngoài không bị tô màu', () => {
    render(<Avatar fallback="Lan" size="sm" tone="soft" />);
    const { circle, wrapper } = parts("LA");
    expect(circle.className).toContain("rounded-full");
    expect(circle.className).toContain("bg-primary-100");
    expect(circle.className).toContain("text-primary-700");
    expect(circle.className).not.toContain("bg-primary-500");
    expect(wrapper.className).not.toMatch(/\bbg-/);
  });

  it("mặc định giữ nền đậm chữ trắng như trước", () => {
    render(<Avatar fallback="Minh" />);
    const { circle } = parts("MI");
    // Q8-A10: bg-primary-500 + chữ trắng chỉ 3.67:1 (axe color-contrast); primary-600 đạt 5.17:1.
    expect(circle.className).toContain("bg-primary-600");
    expect(circle.className).not.toContain("bg-primary-500");
    expect(circle.className).toContain("text-white");
  });

  it("className vẫn chỉ là bố cục của khung ngoài (kích thước, viền), không đụng tới màu hình tròn", () => {
    render(<Avatar fallback="Hoa" className="w-20 h-20 ring-4" />);
    const { circle, wrapper } = parts("HO");
    expect(wrapper.className).toContain("ring-4");
    expect(circle.className).toContain("bg-primary-600");
  });
});

describe("Avatar chữ viết tắt (Q8-PG-09)", () => {
  it("họ tên nhiều từ: chữ đầu của từ đầu và từ cuối, không phải 2 chữ đầu của họ", () => {
    render(<Avatar fallback="Hoàng Văn E" />);
    expect(screen.getByText("HE")).toBeTruthy();
  });

  it("hai người cùng họ không còn cùng viết tắt", () => {
    render(
      <>
        <Avatar fallback="Nguyễn Văn An" />
        <Avatar fallback="Nguyễn Thị Lan" />
      </>
    );
    expect(screen.getByText("NA")).toBeTruthy();
    expect(screen.getByText("NL")).toBeTruthy();
  });
});
