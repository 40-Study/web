/**
 * Ô mật khẩu dùng chung (đăng nhập, đăng ký, đặt lại, đổi mật khẩu) phải có nút hiện/ẩn.
 * Test ĐỎ khi bỏ nút khỏi Input hoặc khi nút không đổi type của ô.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./input";

describe("Input type=password", () => {
  it("hiện và ẩn lại mật khẩu khi bấm nút con mắt", () => {
    render(<Input label="Mật khẩu" type="password" defaultValue="Demo@123" />);
    const field = screen.getByLabelText("Mật khẩu");
    expect(field).toHaveProperty("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));
    expect(field).toHaveProperty("type", "text");
    expect((field as HTMLInputElement).value).toBe("Demo@123");

    fireEvent.click(screen.getByRole("button", { name: "Ẩn mật khẩu" }));
    expect(field).toHaveProperty("type", "password");
  });

  it("nút không submit form", () => {
    let submitted = false;
    render(
      <form onSubmit={(e) => { e.preventDefault(); submitted = true; }}>
        <Input label="Mật khẩu" type="password" />
      </form>
    );
    fireEvent.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));
    expect(submitted).toBe(false);
  });

  it("ô không phải mật khẩu không có nút", () => {
    render(<Input label="Email" type="email" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

/**
 * Icon `absolute` đặt TRƯỚC <Input> ở nơi gọi (search, "@") phải hiện trên ô nhập.
 * Phần tử định vị đứng sau trong DOM vẽ đè phần tử định vị đứng trước, nên Input không được
 * tự thêm tổ tiên `relative` quanh <input> khi không phải ô mật khẩu. Test ĐỎ khi wrapper
 * `relative` quay lại cho ô thường.
 */
describe("Input với icon absolute của nơi gọi", () => {
  function hasPositionedAncestorBelow(el: HTMLElement, boundary: HTMLElement): boolean {
    for (let node = el.parentElement; node && node !== boundary; node = node.parentElement) {
      if (node.classList.contains("relative") || node.classList.contains("absolute")) return true;
    }
    return false;
  }

  it("ô thường không có tổ tiên định vị nào giữa <input> và wrapper của nơi gọi", () => {
    render(
      <div data-testid="caller" className="relative">
        <span className="absolute left-3 top-1/2">icon</span>
        <Input aria-label="Tìm kiếm" className="pl-10" />
      </div>
    );
    expect(
      hasPositionedAncestorBelow(screen.getByLabelText("Tìm kiếm"), screen.getByTestId("caller"))
    ).toBe(false);
  });

  it("vẫn giữ wrapper relative cho ô mật khẩu để định vị nút con mắt", () => {
    render(
      <div data-testid="caller">
        <Input aria-label="Mật khẩu" type="password" />
      </div>
    );
    expect(
      hasPositionedAncestorBelow(screen.getByLabelText("Mật khẩu"), screen.getByTestId("caller"))
    ).toBe(true);
  });
});
