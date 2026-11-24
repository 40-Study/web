/**
 * QA vòng 2 (PG-C1, bước 2): sau khi form đăng ký gửi được, /otp phải hoàn tất đăng ký —
 * nhập đủ 6 số gọi POST /auth/register {email, otp}, xoá dữ liệu tạm và chuyển sang /register/success.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, back: vi.fn(), prefetch: vi.fn() }),
}));

import OtpPage from "./page";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import { ApiError } from "@/lib/errors";
import { STORAGE_KEYS } from "@/lib/constants";

function typeOtp(code: string) {
  code.split("").forEach((digit, i) => {
    fireEvent.change(screen.getByLabelText(`Chữ số OTP ${i + 1}`), { target: { value: digit } });
  });
}

beforeEach(() => {
  resetMockApi();
  push.mockReset();
  replace.mockReset();
  sessionStorage.clear();
});

describe("/otp — hoàn tất đăng ký", () => {
  it("nhập đủ 6 số gọi POST /auth/register đúng một lần rồi sang trang thành công", async () => {
    sessionStorage.setItem(STORAGE_KEYS.REGISTER_EMAIL, "qa@example.com");
    mockApi.post.mockResolvedValue({ data: { message: "User registered successfully", data: { id: "u1" } } });
    renderWithProviders(<OtpPage />);

    typeOtp("123456");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/register/success"));
    expect(mockApi.post).toHaveBeenCalledTimes(1);
    expect(mockApi.post).toHaveBeenCalledWith("/auth/register", { email: "qa@example.com", otp: "123456" });
    expect(sessionStorage.getItem(STORAGE_KEYS.REGISTER_EMAIL)).toBeNull();
    // N-11: trang thành công chỉ mở được ngay sau bước này.
    expect(sessionStorage.getItem(STORAGE_KEYS.REGISTER_SUCCESS_FLAG)).toBe("1");
  });

  it("OTP sai: hiện lỗi tiếng Việt, không chuyển trang", async () => {
    sessionStorage.setItem(STORAGE_KEYS.REGISTER_EMAIL, "qa@example.com");
    mockApi.post.mockRejectedValue(new ApiError(400, "ERR_BAD_REQUEST", "invalid OTP, 2 attempts remaining"));
    renderWithProviders(<OtpPage />);

    typeOtp("000000");

    expect(await screen.findByText("Mã OTP không đúng, còn 2 lần thử")).toBeTruthy();
    expect(push).not.toHaveBeenCalledWith("/register/success");
  });

  // G-05 (QA3 261104): trước đây /otp mở thẳng vẫn hiện "gửi đến email của bạn" + đồng hồ đếm ngược, tới khi
  // gõ đủ 6 số mới bị đẩy đi. Giờ chặn ngay khi mở.
  it("thiếu email trong sessionStorage (mở thẳng /otp): chuyển về /register ngay, không vẽ form OTP", async () => {
    renderWithProviders(<OtpPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/register"));
    expect(screen.queryByLabelText("Chữ số OTP 1")).toBeNull();
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  // N-07 (QA4 261123): "Gửi lại mã" chỉ gửi email (contract 8); trước đây gửi lại cả mật khẩu lưu trong sessionStorage.
  it("Gửi lại mã gọi POST /auth/register/resend-otp chỉ với email", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      sessionStorage.setItem(STORAGE_KEYS.REGISTER_EMAIL, "qa@example.com");
      mockApi.post.mockResolvedValue({ data: { message: "OTP sent" } });
      renderWithProviders(<OtpPage />);
      await screen.findByLabelText("Chữ số OTP 1");
      vi.advanceTimersByTime(91_000);
      fireEvent.click(await screen.findByRole("button", { name: "Gửi lại mã" }));
      await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
      expect(mockApi.post).toHaveBeenCalledWith("/auth/register/resend-otp", { email: "qa@example.com" });
    } finally {
      vi.useRealTimers();
    }
  });
});
