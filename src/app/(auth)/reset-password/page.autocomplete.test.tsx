/** Q9-PG-06 (WCAG 1.3.5): hai ô mật khẩu mới có `autocomplete="new-password"` để trình quản lý mật khẩu đề nghị lưu. */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("@/hooks/queries/use-auth", () => ({
  useResetPassword: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import ResetPasswordPage from "./page";

beforeEach(() => {
  sessionStorage.clear();
  sessionStorage.setItem("reset_password_email", "a@b.vn");
  sessionStorage.setItem("reset_password_otp", "123456");
});

describe("ResetPasswordPage — autocomplete (Q9-PG-06)", () => {
  it("mật khẩu mới và xác nhận: new-password", async () => {
    render(<ResetPasswordPage />);
    expect((await screen.findByLabelText("Mật khẩu mới")).getAttribute("autocomplete")).toBe("new-password");
    expect(screen.getByLabelText("Xác nhận mật khẩu").getAttribute("autocomplete")).toBe("new-password");
  });
});
