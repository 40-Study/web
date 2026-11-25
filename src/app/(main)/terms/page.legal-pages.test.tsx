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
});
