import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PasswordChecklist } from "./password-checklist";

describe("PasswordChecklist", () => {
  it("hiện đúng 4 luật của chính sách mật khẩu, không thêm luật nào", () => {
    render(<PasswordChecklist password="" />);
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Ít nhất 8 ký tự",
      "Có ít nhất 1 chữ in hoa",
      "Có ít nhất 1 chữ số",
      "Có ít nhất 1 ký tự đặc biệt (không phải chữ, số hay khoảng trắng)",
    ]);
  });

  it("chỉ tô xanh luật đã đạt: 'abcdefgh' đạt độ dài, không đạt 3 luật còn lại", () => {
    render(<PasswordChecklist password="abcdefgh" />);
    const passed = screen.getAllByRole("listitem").filter((li) => li.querySelector("span")?.className.includes("green"));
    expect(passed.map((li) => li.textContent)).toEqual(["Ít nhất 8 ký tự"]);
  });

  it("mật khẩu hợp lệ đạt cả 4 luật", () => {
    render(<PasswordChecklist password="Abcdef1!" />);
    const passed = screen.getAllByRole("listitem").filter((li) => li.querySelector("span")?.className.includes("green"));
    expect(passed).toHaveLength(4);
  });
});
