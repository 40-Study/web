/**
 * PG-M3 / F-12 (QA2 261013): gửi form đăng nhập trống hoặc email sai không hiện lời nhắn tiếng Việt —
 * trình duyệt tự bắn tooltip tiếng Anh ("Please include an '@'…") vì form thiếu `noValidate`.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const login = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("@/hooks/queries/use-auth", () => ({ useLogin: () => ({ mutate: login.mutate, isPending: false }) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import LoginPage from "./page";

const submit = () => fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
const typeInto = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => login.mutate.mockReset());

describe("LoginPage — validate tiếng Việt", () => {
  it("form tắt validate native của trình duyệt", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: "Đăng nhập" }).closest("form")?.noValidate).toBe(true);
  });

  it("gửi trống: báo thiếu email và mật khẩu, không gọi API", () => {
    render(<LoginPage />);
    submit();
    expect(screen.getByText("Vui lòng nhập email")).toBeTruthy();
    expect(screen.getByText("Vui lòng nhập mật khẩu")).toBeTruthy();
    expect(login.mutate).not.toHaveBeenCalled();
  });

  it("email thiếu @: báo sai định dạng bằng tiếng Việt", () => {
    render(<LoginPage />);
    typeInto("Email", "abc");
    typeInto("Mật khẩu", "Demo@123");
    submit();
    expect(screen.getByText("Email không đúng định dạng (vd: ten@vidu.com)")).toBeTruthy();
    expect(login.mutate).not.toHaveBeenCalled();
  });

  it("gõ lại vào ô thì lỗi của ô đó biến mất", () => {
    render(<LoginPage />);
    submit();
    typeInto("Email", "a");
    expect(screen.queryByText("Vui lòng nhập email")).toBeNull();
    expect(screen.getByText("Vui lòng nhập mật khẩu")).toBeTruthy();
  });

  it("dữ liệu hợp lệ: gọi đăng nhập với email đã cắt khoảng trắng", () => {
    render(<LoginPage />);
    typeInto("Email", "  admin@demo.com ");
    typeInto("Mật khẩu", "Demo@123");
    submit();
    expect(login.mutate).toHaveBeenCalledTimes(1);
    expect(login.mutate.mock.calls[0]?.[0]).toMatchObject({ email: "admin@demo.com", password: "Demo@123" });
  });
});
