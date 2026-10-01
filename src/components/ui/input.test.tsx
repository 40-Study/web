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
