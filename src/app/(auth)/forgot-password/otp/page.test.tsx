/** N-02 (QA4 261123): /forgot-password/otp mở thẳng từng hiện "đã được gửi đến email" + đồng hồ dù chưa yêu cầu mã. */
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace, back: vi.fn(), prefetch: vi.fn() }),
}));

import ForgotPasswordOtpPage from "./page";
import { renderWithProviders } from "@/test/utils";
import { STORAGE_KEYS } from "@/lib/constants";

beforeEach(() => {
  replace.mockReset();
  sessionStorage.clear();
});

describe("/forgot-password/otp", () => {
  it("chưa yêu cầu mã: về /forgot-password ngay, không vẽ ô OTP", async () => {
    renderWithProviders(<ForgotPasswordOtpPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/forgot-password"));
    expect(screen.queryByLabelText("Chữ số OTP 1")).toBeNull();
  });

  it("đã yêu cầu mã: hiện ô OTP", async () => {
    sessionStorage.setItem(STORAGE_KEYS.RESET_PASSWORD_EMAIL, "qa@example.com");
    renderWithProviders(<ForgotPasswordOtpPage />);
    expect(await screen.findByLabelText("Chữ số OTP 1")).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });
});
