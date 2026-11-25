/** Q7-PG-04: ngày cập nhật thật (dd/MM/yyyy, một hằng chung) và điều khoản về dữ liệu học viên khi liên kết phụ huynh. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LEGAL_PAGES_LAST_UPDATED } from "@/lib/constants";
import TermsPage from "./page";
import PrivacyPage from "../privacy/page";

describe("/terms và /privacy (Q7-PG-04)", () => {
  it("hằng ngày cập nhật có dạng dd/MM/yyyy", () => {
    expect(LEGAL_PAGES_LAST_UPDATED).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it.each([
    ["Điều khoản", TermsPage],
    ["Bảo mật", PrivacyPage],
  ])("%s: hiện ngày cập nhật thật, không chỉ 'năm 2026'", (_name, Page) => {
    render(<Page />);
    expect(screen.getByText(`Cập nhật lần cuối: ${LEGAL_PAGES_LAST_UPDATED}`)).toBeTruthy();
    expect(screen.queryByText("Cập nhật lần cuối: 2026")).toBeNull();
  });

  it.each([
    ["Điều khoản", TermsPage],
    ["Bảo mật", PrivacyPage],
  ])("%s: có mục về phụ huynh liên kết xem dữ liệu học tập của học viên", (_name, Page) => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 2, name: /phụ huynh/i })).toBeTruthy();
    expect(screen.getByText(/phụ huynh .*xem được|phụ huynh có thể xem/)).toBeTruthy();
  });

  // L-1: mục này phải liệt kê ĐỦ những gì trang con của phụ huynh hiện (parent/children/[id]): tiến độ khoá học, lịch học,
  // điểm số, điểm danh, bài tập và thống kê học tập; liệt kê thiếu là hướng sai của một điều khoản công khai dữ liệu.
  it.each([
    ["Điều khoản", TermsPage],
    ["Bảo mật", PrivacyPage],
  ])("%s: liệt kê đủ dữ liệu phụ huynh xem được (cả lịch học và XP / chuỗi ngày / thời gian học)", (_name, Page) => {
    const { container } = render(<Page />);
    const text = container.textContent?.replace(/\s+/g, " ") ?? "";
    for (const item of ["tiến độ khoá học", "lịch học", "điểm số", "điểm danh", "bài tập", "XP", "chuỗi ngày học", "thời gian học"]) {
      expect(text, item).toContain(item);
    }
  });

  it("Bảo mật: nói rõ giáo viên / quản trị tổ chức của các lớp cũng xem được điểm, không chỉ phụ huynh đã liên kết", () => {
    const { container } = render(<PrivacyPage />);
    const text = container.textContent?.replace(/\s+/g, " ") ?? "";
    expect(text).toMatch(/[Gg]iáo viên và quản trị viên .* cũng xem được điểm số/);
    expect(text).toContain("không chia sẻ dữ liệu này với tài khoản phụ huynh nào khác ngoài tài khoản đã liên kết");
    expect(text).not.toContain("chỉ chia sẻ dữ liệu này với tài khoản đã liên kết");
  });
});
