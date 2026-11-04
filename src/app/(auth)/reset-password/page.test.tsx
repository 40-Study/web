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
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), { target: { value: "Abcdef1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
    expect(screen.getByText("Vui lòng nhập lại mật khẩu mới")).toBeTruthy();
  });

  // P-04: chính sách mới được ÁP DỤNG, không chỉ hiển thị.
  it.each(["abcdefgh", "Abcdefg1", "abcdef1!", "Abcdefg!"])("mật khẩu yếu %s: báo câu chính sách, không gọi API", (weak) => {
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), { target: { value: weak } });
    fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu"), { target: { value: weak } });
    fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
    expect(
      screen.getByText("Mật khẩu phải có ít nhất 8 ký tự, gồm ít nhất 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt")
    ).toBeTruthy();
    expect(resetPassword.mutateAsync).not.toHaveBeenCalled();
  });

  it("mật khẩu đạt cả 4 luật: gọi API với đúng mật khẩu", async () => {
    resetPassword.mutateAsync.mockResolvedValue({});
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), { target: { value: "Abcdef1!" } });
    fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu"), { target: { value: "Abcdef1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
    await waitFor(() =>
      expect(resetPassword.mutateAsync).toHaveBeenCalledWith({
        email: "a@b.vn",
        otp: "123456",
        new_password: "Abcdef1!",
        confirm_password: "Abcdef1!",
      })
    );
  });

  it("checklist hiện đúng 4 luật", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText("Có ít nhất 1 chữ in hoa")).toBeTruthy();
    expect(screen.getByText("Có ít nhất 1 chữ số")).toBeTruthy();
    expect(screen.queryByText("Chứa chữ thường (a-z)")).toBeNull();
  });
});
