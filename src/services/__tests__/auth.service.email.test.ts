/**
 * Q8-PG-01 (contract C18): một email = một tài khoản bất kể hoa/thường. Web chuẩn hoá (cắt khoảng trắng + chữ thường) ở
 * MỘT chỗ, `authService`, nên mọi màn hình (trang, modal, OTP, quên mật khẩu) đều gửi cùng một dạng. Trước đây trang đăng nhập
 * chỉ `trim()` nên "Parent1@demo.com" bị backend từ chối, còn form đăng ký lưu nguyên chữ hoa vào khoá OTP.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { authService } from "@/services/auth.service";
import { mockApi, resetMockApi } from "@/test/mock-api";

const MIXED = "  Parent1@Demo.COM ";
const NORMALIZED = "parent1@demo.com";

beforeEach(() => {
  resetMockApi();
  mockApi.post.mockResolvedValue({ data: {} });
});

describe("authService chuẩn hoá email (Q8-PG-01)", () => {
  it("đăng nhập gửi email chữ thường, giữ nguyên các trường còn lại", async () => {
    const device = { device_id: "d", device_name: "n", os: "o" };
    await authService.login({ email: MIXED, password: "x", device_info: device });
    expect(mockApi.post).toHaveBeenCalledWith("/auth/login", { email: NORMALIZED, password: "x", device_info: device });
  });

  it("đăng ký (request, gửi lại mã, xác nhận OTP) gửi email chữ thường", async () => {
    await authService.registerRequest({ email: MIXED, password: "p", confirm_password: "p", user_name: "u" });
    await authService.registerResendOtp({ email: MIXED });
    await authService.register({ email: MIXED, otp: "123456" });
    expect(mockApi.post.mock.calls.map(([url, body]) => [url, (body as { email: string }).email])).toEqual([
      ["/auth/register/request", NORMALIZED],
      ["/auth/register/resend-otp", NORMALIZED],
      ["/auth/register", NORMALIZED],
    ]);
  });

  it("quên mật khẩu (yêu cầu mã, đặt lại) gửi email chữ thường", async () => {
    await authService.resetPasswordRequest({ email: MIXED });
    await authService.resetPassword({ email: MIXED, otp: "123456", new_password: "n", confirm_password: "n" });
    expect(mockApi.post.mock.calls.map(([url, body]) => [url, (body as { email: string }).email])).toEqual([
      ["/auth/reset-password/request", NORMALIZED],
      ["/auth/reset-password", NORMALIZED],
    ]);
  });
});
