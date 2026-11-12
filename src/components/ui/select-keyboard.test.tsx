/**
 * UX-C-01 (P1): Select cũ chỉ có onClick, mục là <div> không role, Esc/Tab không đóng, nên người dùng bàn phím
 * không thêm được thành viên vào tổ chức và không dùng được bộ lọc admin. Test đi đúng luồng bàn phím của QA.
 */

import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialog, DialogContent, DialogTitle } from "./dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

function RoleFilter({ onChange = () => {} }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState("ALL");
  return (
    <>
      <Select
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Chọn vai trò" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tất cả vai trò</SelectItem>
          <SelectItem value="STUDENT">Học viên</SelectItem>
          <SelectItem value="TEACHER">Giảng viên</SelectItem>
          <SelectItem value="ADMIN">Quản trị viên</SelectItem>
        </SelectContent>
      </Select>
      <button type="button">Ô kế tiếp</button>
    </>
  );
}

const trigger = () => screen.getByRole("button", { name: /vai trò|Học viên|Giảng viên|Quản trị/ });
const activeOptionText = () => {
  const listbox = screen.getByRole("listbox", { hidden: true });
  const id = listbox.getAttribute("aria-activedescendant");
  return id ? document.getElementById(id)?.textContent : null;
};

describe("Select — bàn phím và ARIA (UX-C-01)", () => {
  it("trigger báo aria-haspopup/aria-expanded; mục có role option và aria-selected", async () => {
    const user = userEvent.setup();
    render(<RoleFilter />);
    expect(trigger().getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");

    await user.click(trigger());
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(4);
    expect(options[0].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("listbox"));
  });

  it("Enter mở, ↓ đi xuống, Enter chọn và đóng, focus về trigger", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RoleFilter onChange={onChange} />);
    trigger().focus();
    await user.keyboard("{Enter}");
    expect(activeOptionText()).toBe("Tất cả vai trò");
    await user.keyboard("{ArrowDown}");
    expect(activeOptionText()).toBe("Học viên");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("STUDENT");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger());
    expect(trigger().textContent).toContain("Học viên");
  });

  it("Home/End nhảy về đầu/cuối, ↑ ở đầu không vượt ra ngoài", async () => {
    const user = userEvent.setup();
    render(<RoleFilter />);
    trigger().focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{End}");
    expect(activeOptionText()).toBe("Quản trị viên");
    await user.keyboard("{Home}");
    expect(activeOptionText()).toBe("Tất cả vai trò");
    await user.keyboard("{ArrowUp}");
    expect(activeOptionText()).toBe("Tất cả vai trò");
  });

  it("Esc đóng mà không đổi giá trị, focus về trigger", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RoleFilter onChange={onChange} />);
    trigger().focus();
    await user.keyboard("{Enter}{ArrowDown}{Escape}");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(onChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger());
  });

  it("Tab đóng danh sách thay vì để nó mở khi focus đã đi chỗ khác", async () => {
    const user = userEvent.setup();
    render(<RoleFilter />);
    trigger().focus();
    await user.keyboard("{Enter}");
    await user.tab();
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
  });

  it("gõ chữ không dấu nhảy tới mục khớp ('g' tới Giảng viên, 'q' tới Quản trị viên)", async () => {
    const user = userEvent.setup();
    render(<RoleFilter />);
    trigger().focus();
    await user.keyboard("{Enter}");
    await user.keyboard("g");
    expect(activeOptionText()).toBe("Giảng viên");
    await user.keyboard("{Enter}");
    expect(trigger().textContent).toContain("Giảng viên");
  });

  it("bấm chuột ra ngoài thì đóng; bấm lại trigger khi đang mở thì đóng (không mở lại)", async () => {
    const user = userEvent.setup();
    render(<RoleFilter />);
    await user.click(trigger());
    await user.click(trigger());
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    await user.click(trigger());
    fireEvent.mouseDown(document.body);
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
  });

  it("Esc trong Select nằm trong Dialog chỉ đóng danh sách, không đóng Dialog", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Thêm thành viên</DialogTitle>
          <RoleFilter />
        </DialogContent>
      </Dialog>
    );
    trigger().focus();
    await user.keyboard("{Enter}{Escape}");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
