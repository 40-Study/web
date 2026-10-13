/**
 * QA vòng 2 (PG-H2): ở 390px, cụm "công nghệ của bạn" trong H1 hero dùng `whitespace-nowrap` vô điều
 * kiện nên rộng hơn khung và bị cắt hai bên (overflow-x ẩn che mất, không có thanh cuộn). Cụm chữ phải
 * được xuống dòng trên màn hình hẹp; chỉ từ `sm` trở lên mới giữ liền một hàng.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/landing/hero-effects", () => ({ HeroEffects: () => null }));

import { HeroSection } from "./hero-section";

describe("HeroSection — H1 trên màn hình hẹp", () => {
  it("cụm nhấn mạnh không bị ép một hàng ở mobile (nowrap chỉ từ sm trở lên)", () => {
    render(<HeroSection />);

    const heading = screen.getByRole("heading", { level: 1 });
    const accent = heading.querySelector("span");
    expect(accent?.textContent).toContain("công nghệ của bạn");

    const classes = accent?.className.split(/\s+/) ?? [];
    expect(classes).not.toContain("whitespace-nowrap");
  });

  it("H1 cỡ chữ nhỏ hơn ở mobile và tăng dần theo breakpoint", () => {
    render(<HeroSection />);

    const classes = screen.getByRole("heading", { level: 1 }).className.split(/\s+/);
    expect(classes).toContain("text-4xl");
    expect(classes).toContain("sm:text-5xl");
    expect(classes).toContain("md:text-6xl");
  });
});
