/**
 * F5 (QA vòng 2): footer không còn form newsletter báo thành công giả; tên thương hiệu lấy từ
 * siteConfig.name.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
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

  // Chủ dự án chốt 29/09: email hỗ trợ duy nhất là siteConfig.supportEmail; số điện thoại cũ là số giả.
  it("email = siteConfig.supportEmail và KHÔNG còn link điện thoại", () => {
    const { container } = render(<Footer />);
    const mail = container.querySelector('a[href^="mailto:"]');
    expect(mail?.getAttribute("href")).toBe(`mailto:${siteConfig.supportEmail}`);
    expect(siteConfig.supportEmail).toBe("support@fortex.edu.vn");
    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
  });

  it("mã nguồn không còn email contact@40study.com hay số điện thoại giả", () => {
    const SRC = path.resolve(import.meta.dirname, "../..");
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(e.name) && !/footer\.test\.tsx$/.test(e.name)) {
          const text = readFileSync(full, "utf8");
          if (text.includes("contact@40study.com") || text.includes("+84123456789")) hits.push(path.relative(SRC, full));
        }
      }
    };
    walk(SRC);
    expect(hits).toEqual([]);
  });
});