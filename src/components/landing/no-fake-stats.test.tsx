/**
 * QA-A-05: trang chủ khách ghi "Được 10.000+ học viên tin dùng", "10.000+ Học viên đang học", "98% Đánh giá 5 sao"
 * trong khi site có vài khoá, mỗi khoá 0-2 học viên. Chưa có API thống kê công khai nên không được in con số nào
 * về người dùng/đánh giá.
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/landing/hero-effects", () => ({ HeroEffects: () => null }));

import { HeroSection } from "./hero-section";
import { StatsStrip } from "./stats-strip";

const FAKE_CLAIMS = [/10\.000/, /\d+\s*%/, /học viên tin dùng/i, /đánh giá 5 sao/i, /học viên đang học/i];

describe("landing không có số liệu bịa", () => {
  it.each([
    ["HeroSection", <HeroSection key="h" />],
    ["StatsStrip", <StatsStrip key="s" />],
  ])("%s không in số học viên/đánh giá", (_name, element) => {
    const { container } = render(element);
    const text = container.textContent ?? "";
    for (const claim of FAKE_CLAIMS) expect(text).not.toMatch(claim);
  });
});
