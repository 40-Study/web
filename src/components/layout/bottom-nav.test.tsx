/**
 * QA 260927 guest P1 — bottom-tab nav mobile cho khách chưa đăng nhập.
 *
 * Proves: bộ tab "guest" KHÔNG còn dẫn thẳng vào tường đăng nhập
 * (/home, /schedule, /leaderboard) — chỉ còn Trang chủ (/), Khóa học
 * (/courses), Đăng nhập (/login).
 *
 * Dự án chưa cài `@testing-library/jest-dom` (không có trong `vitest.setup.ts`),
 * nên đọc thẳng `.getAttribute("href")` thay vì matcher `toHaveAttribute()`.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BottomNav } from "./bottom-nav";

describe("BottomNav — bộ tab guest", () => {
  it("guest: chỉ Trang chủ(/), Khóa học(/courses), Đăng nhập(/login)", () => {
    render(<BottomNav role="guest" />);

    const home = screen.getByRole("link", { name: /Trang chủ/i });
    expect(home.getAttribute("href")).toBe("/");

    const courses = screen.getByRole("link", { name: /Khóa học/i });
    expect(courses.getAttribute("href")).toBe("/courses");

    const login = screen.getByRole("link", { name: /Đăng nhập/i });
    expect(login.getAttribute("href")).toBe("/login");

    // Không còn mục nào dẫn tới route yêu cầu đăng nhập
    expect(screen.queryByText("Lịch học")).toBeNull();
    expect(screen.queryByText("Xếp hạng")).toBeNull();
  });

  it("student: vẫn giữ nguyên 5 mục cũ (Trang chủ trỏ /home, không phải /)", () => {
    render(<BottomNav role="student" />);

    const home = screen.getByRole("link", { name: /Trang chủ/i });
    expect(home.getAttribute("href")).toBe("/home");
    expect(screen.getByText("Xếp hạng")).toBeTruthy();
  });

  it("parent: nhãn Con của tôi trỏ /settings/family", () => {
    render(<BottomNav role="parent" />);

    const family = screen.getByRole("link", { name: /Con của tôi/i });
    expect(family.getAttribute("href")).toBe("/settings/family");
  });
});
