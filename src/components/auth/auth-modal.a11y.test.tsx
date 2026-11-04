/**
 * G-02 (QA3 261104): modal Đăng nhập/Đăng ký ở header không có role=dialog, Esc không đóng, và gửi form trống hiện
 * tooltip tiếng Anh của trình duyệt ("Please fill out this field").
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const login = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("@/hooks/queries/use-auth", () => ({
  useLogin: () => ({ mutate: login.mutate, isPending: false }),
  useRegisterRequest: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRegister: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSelectRole: () => ({ mutate: vi.fn(), isPending: false }),
  authErrorMessage: (_e: unknown, fallback: string) => fallback,
  translateOtpErrorMessage: (m: string) => m,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

import { AuthModal } from "./auth-modal";

const onClose = vi.fn();

beforeEach(() => {
  onClose.mockReset();
  login.mutate.mockReset();
});

describe("AuthModal — ngữ nghĩa dialog và bàn phím", () => {
  it("có role=dialog, aria-modal và tên", () => {
    render(<AuthModal isOpen onClose={onClose} />);
    const dialog = screen.getByRole("dialog", { name: "Đăng nhập" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  it("chế độ đăng ký có tên 'Đăng ký tài khoản'", () => {
    render(<AuthModal isOpen onClose={onClose} initialMode="register" />);
    expect(screen.getByRole("dialog", { name: "Đăng ký tài khoản" })).toBeTruthy();
  });

  it("Esc đóng modal ở màn hình bắt đầu", () => {
    render(<AuthModal isOpen onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("focus vào trong modal khi mở và Tab xoay vòng, không thoát ra ngoài", () => {
    render(<AuthModal isOpen onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);

    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])'),
    );
    focusables[focusables.length - 1].focus();
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Tab" });
    expect(document.activeElement).toBe(focusables[0]);

    focusables[0].focus();
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(focusables[focusables.length - 1]);
  });

  it("Esc khi đang ở giữa luồng đăng ký mở hộp xác nhận; Esc lần nữa đóng hộp xác nhận, không đóng modal", () => {
    render(<AuthModal isOpen onClose={onClose} initialMode="register" />);
    fireEvent.click(screen.getByRole("button", { name: /Email/ }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("alertdialog", { name: "Thoát đăng ký?" })).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("AuthModal — validate tiếng Việt, không dùng tooltip trình duyệt", () => {
  it("form đăng nhập: noValidate, gửi trống báo lỗi tiếng Việt, không gọi API", () => {
    render(<AuthModal isOpen onClose={onClose} />);
    const submit = screen.getByRole("button", { name: "Đăng nhập" });
    expect(submit.closest("form")?.noValidate).toBe(true);

    fireEvent.click(submit);
    expect(screen.getByText("Vui lòng nhập email")).toBeTruthy();
    expect(screen.getByText("Vui lòng nhập mật khẩu")).toBeTruthy();
    expect(login.mutate).not.toHaveBeenCalled();
  });

  it("form đăng ký: noValidate, gửi trống báo lỗi từng ô", () => {
    render(<AuthModal isOpen onClose={onClose} initialMode="register" />);
    fireEvent.click(screen.getByRole("button", { name: /Email/ }));
    const submit = screen.getByRole("button", { name: "Tiếp tục" });
    expect(submit.closest("form")?.noValidate).toBe(true);

    fireEvent.click(submit);
    expect(screen.getByText("Vui lòng nhập tên đăng nhập")).toBeTruthy();
    expect(screen.getByText("Vui lòng nhập họ")).toBeTruthy();
    expect(screen.getByText("Vui lòng nhập tên")).toBeTruthy();
    expect(screen.getByText("Vui lòng nhập email")).toBeTruthy();
    expect(screen.getByText(/ít nhất 8 ký tự/)).toBeTruthy();
  });
});
