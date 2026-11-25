/**
 * Q6-PG-02: trong modal đăng ký ở header, nhập mã OTP khi đăng ký đang chờ đã hết hạn (backend trả 410
 * ERR_REGISTRATION_EXPIRED, contract C7) từng chỉ hiện câu chữ, 6 ô trống và không có đường đi tiếp.
 * Phải giống trang /otp: quay lại form đăng ký, điền sẵn email, báo bằng toast.
 * Q6-PG-19: lỗi backend dự kiến (email trùng, 429) không được ghi console.error.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

import { AuthModal } from "./auth-modal";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import { ApiError } from "@/lib/errors";
import { toast } from "sonner";
import { STORAGE_KEYS } from "@/lib/constants";

const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

async function reachOtpStep() {
  renderWithProviders(<AuthModal isOpen onClose={vi.fn()} initialMode="register" />);
  fireEvent.click(screen.getByRole("button", { name: /Email/ }));
  fill("Tên đăng nhập", "qaguest86464");
  fill("Họ", "Nguyễn");
  fill("Tên", "QA Guest");
  fill("Email", "qaguest86464@example.com");
  fill("Mật khẩu", "Abcdef12#");
  fill("Xác nhận mật khẩu", "Abcdef12#");
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
  await screen.findByLabelText("Chữ số OTP 1");
}

function typeOtp(code: string) {
  code.split("").forEach((d, i) => fireEvent.change(screen.getByLabelText(`Chữ số OTP ${i + 1}`), { target: { value: d } }));
}

let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  resetMockApi();
  sessionStorage.clear();
  vi.mocked(toast.error).mockClear();
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => consoleError.mockRestore());

describe("AuthModal — OTP đăng ký hết hạn (Q6-PG-02)", () => {
  it("410 ERR_REGISTRATION_EXPIRED: về form đăng ký với email điền sẵn, có toast, xoá email chờ", async () => {
    mockApi.post.mockImplementation(async (url: string) => {
      if (url === "/auth/register") throw new ApiError(410, "ERR_REGISTRATION_EXPIRED", "registration expired");
      return { data: { message: "OTP sent" } };
    });
    await reachOtpStep();

    typeOtp("123456");

    await waitFor(() => expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("qaguest86464@example.com"));
    expect(toast.error).toHaveBeenCalledWith("Phiên đăng ký đã hết hạn. Vui lòng đăng ký lại.");
    expect(sessionStorage.getItem(STORAGE_KEYS.REGISTER_EMAIL)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.REGISTER_PREFILL_EMAIL)).toBeNull();
    expect(screen.queryByLabelText("Chữ số OTP 1")).toBeNull();
  });

  it("OTP sai (400) vẫn ở lại bước OTP với lỗi inline", async () => {
    mockApi.post.mockImplementation(async (url: string) => {
      if (url === "/auth/register") throw new ApiError(400, "ERR_BAD_REQUEST", "invalid OTP, 2 attempts remaining");
      return { data: { message: "OTP sent" } };
    });
    await reachOtpStep();
    typeOtp("000000");
    expect(await screen.findByText("Mã OTP không đúng, còn 2 lần thử")).toBeTruthy();
    expect(screen.getByLabelText("Chữ số OTP 1")).toBeTruthy();
  });

  it("PG-19: email trùng (ApiError 409) không ghi console.error", async () => {
    mockApi.post.mockRejectedValue(new ApiError(409, "ERR_EMAIL_EXISTS", "email already exists"));
    renderWithProviders(<AuthModal isOpen onClose={vi.fn()} initialMode="register" />);
    fireEvent.click(screen.getByRole("button", { name: /Email/ }));
    fill("Tên đăng nhập", "qaguest86464");
    fill("Họ", "Nguyễn");
    fill("Tên", "QA Guest");
    fill("Email", "qaguest86464@example.com");
    fill("Mật khẩu", "Abcdef12#");
    fill("Xác nhận mật khẩu", "Abcdef12#");
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    await waitFor(() => expect(mockApi.post).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole("button", { name: "Tiếp tục" })).toBeTruthy());
    expect(consoleError).not.toHaveBeenCalledWith("Failed to request OTP:", expect.anything());
  });
});
