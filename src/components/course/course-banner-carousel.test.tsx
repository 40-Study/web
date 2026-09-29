/**
 * F4 (QA vòng 2): nút CTA của banner phải là link thật tới route có thật; không còn slug khoá học
 * bịa và không còn banner "Flash Sale" hứa giảm giá không tồn tại.
 */

import { readdirSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BANNERS, CourseBannerCarousel } from "./course-banner-carousel";

const APP_ROOT = path.resolve(import.meta.dirname, "../../app");

function collectRoutes(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectRoutes(full, acc);
    else if (entry.name === "page.tsx") {
      const rel = path.relative(APP_ROOT, dir).split(path.sep).filter((s) => !/^\(.+\)$/.test(s));
      acc.push(`/${rel.join("/")}`.replace(/\/$/, "") || "/");
    }
  }
  return acc;
}

describe("CourseBannerCarousel", () => {
  it("mỗi CTA là <a> có href trùng banner (trước đây là <button> không làm gì)", () => {
    render(<CourseBannerCarousel />);
    for (const banner of BANNERS) {
      const link = screen.getByRole("link", { name: banner.cta });
      expect(link.getAttribute("href")).toBe(banner.href);
    }
  });

  it("mọi href trỏ tới một page.tsx có thật (không slug khoá học bịa)", () => {
    const routes = collectRoutes(APP_ROOT);
    for (const banner of BANNERS) {
      expect(routes, `banner ${banner.id} trỏ ${banner.href} nhưng không có page.tsx`).toContain(banner.href);
    }
  });

  it("không hứa Flash Sale/giảm giá", () => {
    render(<CourseBannerCarousel />);
    expect(screen.queryByText(/flash sale|giảm đến/i)).toBeNull();
  });
});
