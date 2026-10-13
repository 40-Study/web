/**
 * PG-M3 (QA2 261013): quên mật khẩu với email sai ("abc") không gửi request và không hiện lỗi tiếng Việt —
 * trình duyệt chặn bằng tooltip tiếng Anh vì form thiếu `noValidate`.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reset = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
vi.mock("@/hooks/queries/use-auth", () => ({
  useResetPasswordRequest: () => ({ mutateAsync: reset.mutateAsync, isPending: false }),
}));

import ForgotPasswordPage from "./page";

const submit = () => fireEvent.click(screen.getByRole("button", { name: "Gửi mã xác thực" }));

beforeEach(() => {
  reset.mutateAsync.mockReset().mockResolvedValue(undefined);
  sessionStorage.clear();
});

describe("ForgotPasswordPage — validate tiếng Việt", () => {
  it("form tắt validate native của trình duyệt", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole("button", { name: "Gửi mã xác thực" }).closest("form")?.noValidate).toBe(true);
  });

  it("gửi trống: báo thiếu email, không gọi API", () => {
    render(<ForgotPasswordPage />);
    submit();
    expect(screen.getByText("Vui lòng nhập email")).toBeTruthy();
    expect(reset.mutateAsync).not.toHaveBeenCalled();
  });

  it('email "abc": báo sai định dạng, không gọi API, không lưu email vào session', () => {
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "abc" } });
    submit();
    expect(screen.getByText("Email không đúng định dạng (vd: ten@vidu.com)")).toBeTruthy();
    expect(reset.mutateAsync).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("reset_password_email")).toBeNull();
  });

  it("email hợp lệ: gọi API và lưu email đã cắt khoảng trắng", async () => {
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: " a@b.vn " } });
    submit();
    await waitFor(() => expect(reset.mutateAsync).toHaveBeenCalledWith({ email: "a@b.vn" }));
    expect(sessionStorage.getItem("reset_password_email")).toBe("a@b.vn");
  });
});
