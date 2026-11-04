import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InlineCodeText } from "./inline-code-text";

describe("InlineCodeText (QA3 Q15: đề bài in nguyên dấu backtick)", () => {
  it("biến `mã` thành <code> và bỏ dấu backtick", () => {
    const { container } = render(<p><InlineCodeText text="Chạy `<cờ> <tên>` hoặc `EMPTY` nếu rỗng" /></p>);
    const codes = [...container.querySelectorAll("code")].map((c) => c.textContent);
    expect(codes).toEqual(["<cờ> <tên>", "EMPTY"]);
    expect(container.textContent).toBe("Chạy <cờ> <tên> hoặc EMPTY nếu rỗng");
    expect(container.textContent).not.toContain("`");
  });
  it("không chèn HTML: thẻ trong chữ vẫn là chữ", () => {
    const { container } = render(<p><InlineCodeText text="<img src=x onerror=alert(1)> và `<b>`" /></p>);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
  });
  it("backtick lẻ giữ nguyên là chữ", () => {
    const { container } = render(<p><InlineCodeText text="dấu ` lẻ" /></p>);
    expect(container.querySelector("code")).toBeNull();
    expect(container.textContent).toBe("dấu ` lẻ");
  });
});
