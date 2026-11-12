/**
 * UX-A-09 / UX-C-07: nút chỉ có icon phải có tên truy cập (cảnh báo khi dev).
 * UX-C-05: nút X gỡ trong badge phải có vùng bấm 24×24 và tên nói rõ gỡ cái gì.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Badge, BadgeRemoveButton } from "./badge";
import { Button } from "./button";

describe("Button size=icon — cảnh báo khi thiếu tên", () => {
  it("cảnh báo khi không có aria-label/aria-labelledby/title", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Button size="icon">x</Button>);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("thiếu aria-label"));
  });

  it("không cảnh báo khi có aria-label, hoặc asChild mà phần tử con có aria-label", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Button size="icon" aria-label="Quay lại">x</Button>);
    render(
      <Button size="icon" asChild>
        <a href="/admin/users" aria-label="Quay lại danh sách người dùng">x</a>
      </Button>
    );
    render(<Button>Lưu</Button>);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("BadgeRemoveButton — vùng bấm và tên", () => {
  it("có class h-6 w-6 (24×24), type=button, tên đúng và gọi onClick", () => {
    const onClick = vi.fn();
    render(
      <Badge>
        Giáo viên
        <BadgeRemoveButton aria-label="Gỡ vai trò Giáo viên của An" onClick={onClick} />
      </Badge>
    );
    const button = screen.getByRole("button", { name: "Gỡ vai trò Giáo viên của An" });
    expect(button.className).toContain("h-6");
    expect(button.className).toContain("w-6");
    expect(button.getAttribute("type")).toBe("button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
