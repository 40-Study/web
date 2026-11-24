/**
 * Q5-PG-05: mã OTP sai chỉ lộ ra ở bước đặt mật khẩu mới. Trước đây trang đó chỉ toast, giữ mã sai trong
 * sessionStorage và không có chỗ nhập lại. Nay: xoá mã sai, về bước OTP, câu lỗi hiện ngay dưới 6 ô.
 * Q5-PG-07: gửi lại mã thất bại không được khởi động lại đồng hồ.
 */
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import ForgotPasswordOtpPage from "./page";
import ResetPasswordPage from "../../reset-password/page";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import { ApiError, RateLimitError } from "@/lib/errors";
import { toast } from "sonner";

beforeEach(() => {
  resetMockApi();
  push.mockReset();
  replace.mockReset();
  vi.mocked(toast.error).mockClear();
  sessionStorage.clear();
});

function submitNewPassword() {
  fireEvent.change(screen.getByLabelText("Mật khẩu mới"), { target: { value: "Abcdef1!" } });
  fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu"), { target: { value: "Abcdef1!" } });
  fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
}

describe("reset-password: OTP sai", () => {
  beforeEach(() => {
    sessionStorage.setItem("reset_password_email", "a@b.vn");
    sessionStorage.setItem("reset_password_otp", "000000");
  });

  it("xoá mã sai, về bước OTP, không toast thêm lần nữa", async () => {
    mockApi.post.mockRejectedValue(new ApiError(400, "ERR_BAD_REQUEST", "invalid OTP, 4 attempts remaining"));
    renderWithProviders(<ResetPasswordPage />);
    await screen.findByLabelText("Mật khẩu mới");
    submitNewPassword();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/forgot-password/otp"));
    expect(sessionStorage.getItem("reset_password_otp")).toBeNull();
    expect(sessionStorage.getItem("reset_password_email")).toBe("a@b.vn");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("lỗi không phải OTP (mật khẩu bị từ chối): ở lại trang, giữ mã, toast", async () => {
    mockApi.post.mockRejectedValue(new ApiError(400, "ERR_BAD_REQUEST", "password too common"));
    renderWithProviders(<ResetPasswordPage />);
    await screen.findByLabelText("Mật khẩu mới");
    submitNewPassword();

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("reset_password_otp")).toBe("000000");
  });
});

describe("forgot-password/otp", () => {
  beforeEach(() => sessionStorage.setItem("reset_password_email", "a@b.vn"));

  it("hiện câu lỗi OTP mà bước đặt mật khẩu để lại, đúng một lần", async () => {
    sessionStorage.setItem("reset_password_otp_error", "Mã OTP không đúng, còn 4 lần thử");
    const { unmount } = renderWithProviders(<ForgotPasswordOtpPage />);
    expect(await screen.findByText("Mã OTP không đúng, còn 4 lần thử")).toBeTruthy();
    expect(sessionStorage.getItem("reset_password_otp_error")).toBeNull();
    unmount();
    renderWithProviders(<ForgotPasswordOtpPage />);
    await screen.findByLabelText("Chữ số OTP 1");
    expect(screen.queryByText(/còn 4 lần thử/)).toBeNull();
  });

  it("gõ đủ mã mới thì câu lỗi cũ biến mất và mã mới được lưu", async () => {
    sessionStorage.setItem("reset_password_otp_error", "Mã OTP không đúng, còn 4 lần thử");
    renderWithProviders(<ForgotPasswordOtpPage />);
    await screen.findByText(/còn 4 lần thử/);
    "123456".split("").forEach((d, i) =>
      fireEvent.change(screen.getByLabelText(`Chữ số OTP ${i + 1}`), { target: { value: d } }),
    );
    expect(screen.queryByText(/còn 4 lần thử/)).toBeNull();
    expect(sessionStorage.getItem("reset_password_otp")).toBe("123456");
    expect(push).toHaveBeenCalledWith("/reset-password");
  });

  describe("Gửi lại mã", () => {
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
    afterEach(() => vi.useRealTimers());

    it("429: ở lại, đồng hồ KHÔNG chạy lại", async () => {
      mockApi.post.mockRejectedValue(new RateLimitError(100));
      renderWithProviders(<ForgotPasswordOtpPage />);
      await screen.findByLabelText("Chữ số OTP 1");
      act(() => {
        vi.advanceTimersByTime(91_000);
      });
      fireEvent.click(await screen.findByRole("button", { name: "Gửi lại mã" }));
      await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(screen.queryByRole("button", { name: "Đang gửi..." })).toBeNull());
      expect(screen.queryByText(/Gửi lại mã sau/)).toBeNull();
      expect(screen.getByRole("button", { name: "Gửi lại mã" })).toBeTruthy();
    });
  });
});
