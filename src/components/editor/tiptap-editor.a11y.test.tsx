/**
 * Q7-T07: `<Label htmlFor="assignment-instructions">` trỏ tới id không tồn tại và vùng soạn thảo (div[role=textbox])
 * không có tên truy cập được. Giờ editor nhận `id` + `ariaLabelledBy`/`ariaLabel` và đặt lên chính vùng soạn thảo.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TiptapEditor } from "./tiptap-editor";

describe("TiptapEditor — tên truy cập được (Q7-T07)", () => {
  it("id + aria-labelledby nằm trên vùng soạn thảo, tên lấy từ nhãn", async () => {
    render(
      <>
        <span id="lbl">Yêu cầu chi tiết *</span>
        <TiptapEditor id="assignment-instructions" ariaLabelledBy="lbl" />
      </>
    );
    const box = await screen.findByRole("textbox", { name: "Yêu cầu chi tiết *" });
    expect(box.id).toBe("assignment-instructions");
    expect(document.getElementById("assignment-instructions")).toBe(box);
  });

  it("ariaLabel đặt tên khi không có nhãn hiển thị", async () => {
    render(<TiptapEditor ariaLabel="Nội dung" />);
    expect(await screen.findByRole("textbox", { name: "Nội dung" })).toBeTruthy();
  });

  it("readOnly: vùng soạn thảo báo aria-readonly; soạn được thì không có (L5)", async () => {
    const { unmount } = render(<TiptapEditor ariaLabel="Chỉ đọc" readOnly />);
    expect((await screen.findByRole("textbox", { name: "Chỉ đọc" })).getAttribute("aria-readonly")).toBe("true");
    unmount();
    render(<TiptapEditor ariaLabel="Soạn được" />);
    expect((await screen.findByRole("textbox", { name: "Soạn được" })).getAttribute("aria-readonly")).toBeNull();
  });
});
