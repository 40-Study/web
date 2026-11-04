/**
 * G-05 (QA3 261104): /reset-password mở thẳng hiện đủ form cho khách, chỉ khi bấm gửi mới báo "Phiên đặt lại mật khẩu đã
 * hết hạn"; form còn lộ tooltip tiếng Anh vì thiếu noValidate.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
const resetPassword = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
vi.mock("@/hooks/queries/use-auth", () => ({
  useResetPassword: () => ({ mutateAsync: resetPassword.mutateAsync, isPending: false }),
}));

import ResetPasswordPage from "./page";

beforeEach(() => {
  replace.mockReset();
  resetPassword.mutateAsync.mockReset();
  sessionStorage.clear();
});

describe("/reset-password — guard khi mở thẳng", () => {
  it("chưa qua bước quên mật khẩu: chuyển về /forgot-password ngay, không vẽ form", async () => {
    render(<ResetPasswordPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/forgot-password"));
    expect(screen.queryByLabelText("Mật khẩu mới")).toBeNull();
  });

  it("có email nhưng thiếu OTP: vẫn chuyển hướng", async () => {
    sessionStorage.setItem("reset_password_email", "a@b.vn");
    render(<ResetPasswordPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/forgot-password"));
  });
});

describe("/reset-password — form hợp lệ phiên", () => {
  beforeEach(() => {
    sessionStorage.setItem("reset_password_email", "a@b.vn");
    sessionStorage.setItem("reset_password_otp", "123456");
  });

  it("có đủ phiên: hiện form, noValidate, không chuyển hướng", () => {
    render(<ResetPasswordPage />);
    const submit = screen.getByRole("button", { name: "Đặt lại mật khẩu" });
    expect(submit.closest("form")?.noValidate).toBe(true);
    expect(replace).not.toHaveBeenCalled();
  });

  it("gửi trống: báo tiếng Việt, không gọi API", () => {
    render(<ResetPasswordPage />);
    fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
    expect(screen.getByText("Vui lòng nhập mật khẩu mới")).toBeTruthy();
    expect(resetPassword.mutateAsync).not.toHaveBeenCalled();
  });

  it("thiếu xác nhận mật khẩu: báo ở ô xác nhận", () => {
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), { target: { value: "Abcdef12" } });
    fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
    expect(screen.getByText("Vui lòng nhập lại mật khẩu mới")).toBeTruthy();
  });
});
