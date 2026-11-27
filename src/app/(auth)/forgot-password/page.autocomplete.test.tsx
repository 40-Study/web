/** Q9-PG-06 (WCAG 1.3.5): ô email quên mật khẩu có `autocomplete="email"` và `name`. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/queries/use-auth", () => ({
  useResetPasswordRequest: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import ForgotPasswordPage from "./page";

describe("ForgotPasswordPage — autocomplete (Q9-PG-06)", () => {
  it("ô Email: autocomplete=email, name=email", () => {
    render(<ForgotPasswordPage />);
    const input = screen.getByLabelText("Email");
    expect(input.getAttribute("autocomplete")).toBe("email");
    expect(input.getAttribute("name")).toBe("email");
  });
});
