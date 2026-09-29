/**
 * F5 (QA vòng 2): footer không còn form newsletter báo thành công giả; tên thương hiệu lấy từ
 * siteConfig.name.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { siteConfig } from "@/lib/constants";
import { Footer } from "./footer";

describe("Footer", () => {
  it("không có ô nhập email / nút Gửi / lời cảm ơn đăng ký giả", () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('input[type="email"]')).toBeNull();
    expect(screen.queryByText(/Đăng ký nhận tin/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Gửi" })).toBeNull();
  });

  it("có link tới /help công khai và tên thương hiệu từ siteConfig", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Trung tâm trợ giúp" }).getAttribute("href")).toBe("/help");
    expect(screen.getByLabelText(`Gửi email cho ${siteConfig.name}`)).toBeTruthy();
  });
});
