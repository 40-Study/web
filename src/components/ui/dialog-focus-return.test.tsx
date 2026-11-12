/**
 * UX-B-02: đóng dialog (Esc, Huỷ, nút X) thì focus phải về đúng nút đã mở, không rơi về <body>.
 * Lỗi gốc: Dialog ghi trigger trong effect, mà effect của DialogContent (đưa focus vào trong) chạy trước,
 * nên Dialog ghi nhầm nút X; đóng thì nút X bị gỡ và focus mất.
 */

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Dialog, DialogContent, DialogTitle } from "./dialog";

function DialogHarness({ autoFocusInput = false }: { autoFocusInput?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Thêm chương
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Thêm chương mới</DialogTitle>
          <input aria-label="Tên chương" autoFocus={autoFocusInput} />
          <button type="button" onClick={() => setOpen(false)}>
            Huỷ
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}

const opener = () => screen.getByRole("button", { name: "Thêm chương" });

describe("Dialog — trả focus về nút mở (UX-B-02)", () => {
  it("Esc: focus về nút mở", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(opener());
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener());
  });

  it("nút Huỷ: focus về nút mở", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(opener());
    await user.click(screen.getByRole("button", { name: "Huỷ" }));
    expect(document.activeElement).toBe(opener());
  });

  it("nút X (Đóng hộp thoại): focus về nút mở", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    opener().focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Đóng hộp thoại" }));
    expect(document.activeElement).toBe(opener());
  });

  it("ô nhập có autoFocus trong dialog vẫn không làm Dialog ghi nhầm trigger", async () => {
    const user = userEvent.setup();
    render(<DialogHarness autoFocusInput />);
    await user.click(opener());
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Tên chương" }));
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(opener());
  });

  it("ConfirmDialog: Huỷ trả focus về nút Xoá đã mở nó", async () => {
    const user = userEvent.setup();
    function ConfirmHarness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Xoá thẻ
          </button>
          <ConfirmDialog
            open={open}
            onOpenChange={setOpen}
            title="Xoá thẻ?"
            confirmLabel="Xoá"
            destructive
            onConfirm={() => setOpen(false)}
          />
        </>
      );
    }
    render(<ConfirmHarness />);
    await user.click(screen.getByRole("button", { name: "Xoá thẻ" }));
    await user.click(screen.getByRole("button", { name: "Huỷ" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Xoá thẻ" }));
  });
});
