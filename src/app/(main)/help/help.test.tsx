/**
 * F2 (QA vòng 2): /help là FAQ tĩnh trung thực bằng tiếng Việt, không hứa "hoàn tiền 7 ngày",
 * không còn ô "Chat trực tuyến"/"Tài liệu hướng dẫn" chết (href="#").
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HelpPage from "./page";
import { faqCategories, filterFaqCategories } from "./faq-data";

describe("faq-data", () => {
  it("không nhắc hoàn tiền theo số ngày (chủ dự án đã bỏ cam kết 7 ngày)", () => {
    const all = JSON.stringify(faqCategories);
    expect(all).not.toMatch(/7 ngày|bảy ngày/i);
    expect(all).not.toMatch(/trong vòng \d+ ngày/i);
  });

  it("lọc theo từ khoá bỏ nhóm rỗng; từ khoá lạ -> không còn nhóm nào", () => {
    expect(filterFaqCategories("").length).toBe(faqCategories.length);
    expect(filterFaqCategories("mật khẩu").length).toBeGreaterThan(0);
    expect(filterFaqCategories("zzzkhongco")).toEqual([]);
  });
});

describe("HelpPage", () => {
  it("hiện tiêu đề, email hỗ trợ thật và không có link chết href=#", () => {
    const { container } = render(<HelpPage />);
    expect(screen.getByRole("heading", { name: /Trợ giúp/ })).toBeTruthy();
    expect(container.querySelector('a[href^="mailto:"]')).not.toBeNull();
    expect(container.querySelector('a[href="#"]')).toBeNull();
    expect(screen.queryByText(/Chat trực tuyến/)).toBeNull();
  });

  it("bấm câu hỏi mở câu trả lời; tìm không ra thì có trạng thái rỗng và nút xoá", () => {
    render(<HelpPage />);
    const q = screen.getByRole("button", { name: /Tôi quên mật khẩu/ });
    expect(q.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(q);
    expect(q.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(/mã OTP/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Tìm kiếm câu hỏi"), { target: { value: "zzzkhongco" } });
    expect(screen.getByText(/Không tìm thấy kết quả/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Xóa tìm kiếm" }));
    expect(screen.getByRole("button", { name: /Tôi quên mật khẩu/ })).toBeTruthy();
  });
});
