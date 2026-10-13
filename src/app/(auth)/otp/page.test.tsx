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
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
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
  sessionStorage.clear();
});

describe("/otp — hoàn tất đăng ký", () => {
  it("nhập đủ 6 số gọi POST /auth/register đúng một lần rồi sang trang thành công", async () => {
    sessionStorage.setItem(STORAGE_KEYS.REGISTER_EMAIL, "qa@example.com");
    sessionStorage.setItem(STORAGE_KEYS.REGISTER_PAYLOAD, "{}");
    mockApi.post.mockResolvedValue({ data: { message: "User registered successfully", data: { id: "u1" } } });
    renderWithProviders(<OtpPage />);

    typeOtp("123456");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/register/success"));
    expect(mockApi.post).toHaveBeenCalledTimes(1);
    expect(mockApi.post).toHaveBeenCalledWith("/auth/register", { email: "qa@example.com", otp: "123456" });
    expect(sessionStorage.getItem(STORAGE_KEYS.REGISTER_EMAIL)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.REGISTER_PAYLOAD)).toBeNull();
  });

  it("OTP sai: hiện lỗi tiếng Việt, không chuyển trang", async () => {
    sessionStorage.setItem(STORAGE_KEYS.REGISTER_EMAIL, "qa@example.com");
    mockApi.post.mockRejectedValue(new ApiError(400, "ERR_BAD_REQUEST", "invalid OTP, 2 attempts remaining"));
    renderWithProviders(<OtpPage />);

    typeOtp("000000");

    expect(await screen.findByText("Mã OTP không đúng, còn 2 lần thử")).toBeTruthy();
    expect(push).not.toHaveBeenCalledWith("/register/success");
  });

  it("thiếu email trong sessionStorage (mở thẳng /otp): quay về /register", async () => {
    renderWithProviders(<OtpPage />);

    typeOtp("123456");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/register"));
    expect(mockApi.post).not.toHaveBeenCalled();
  });
});
