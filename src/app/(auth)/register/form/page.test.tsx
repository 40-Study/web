/**
 * QA vòng 2 (PG-C1): /register/form không bao giờ gửi request. validate() luôn gán key `username`
 * (kể cả khi hợp lệ, giá trị undefined) nên `Object.keys(errors).length > 0` luôn đúng -> không ai
 * đăng ký được. Test này khoá: form hợp lệ PHẢI gọi API register/request rồi sang trang /otp.
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

import RegisterFormPage from "./page";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import { ApiError } from "@/lib/errors";
import { STORAGE_KEYS } from "@/lib/constants";

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillValidForm() {
  fill("Tên đăng nhập", "qaguest86464");
  fill("Họ", "Nguyễn");
  fill("Tên", "QA Guest");
  fill("Email", "qaguest86464@example.com");
  fill("Mật khẩu", "Abcdef12#");
  fill("Xác nhận mật khẩu", "Abcdef12#");
}

beforeEach(() => {
  resetMockApi();
  push.mockReset();
  sessionStorage.clear();
});

describe("/register/form — gửi đăng ký", () => {
  it("form hợp lệ gọi POST /auth/register/request rồi chuyển sang /otp", async () => {
    mockApi.post.mockResolvedValue({ data: { message: "OTP sent" } });
    renderWithProviders(<RegisterFormPage />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
    expect(mockApi.post).toHaveBeenCalledWith("/auth/register/request", {
      email: "qaguest86464@example.com",
      password: "Abcdef12#",
      confirm_password: "Abcdef12#",
      user_name: "qaguest86464",
      full_name: "Nguyễn QA Guest",
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/otp"));
    expect(sessionStorage.getItem(STORAGE_KEYS.REGISTER_EMAIL)).toBe("qaguest86464@example.com");
  });

  it("form sai vẫn bị chặn: không gọi API và hiện lỗi từng ô", async () => {
    renderWithProviders(<RegisterFormPage />);

    fill("Tên đăng nhập", "a@b");
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));

    expect(await screen.findByText("Vui lòng nhập họ")).toBeTruthy();
    expect(screen.getByText(/Tên đăng nhập gồm 3-30 ký tự/)).toBeTruthy();
    expect(mockApi.post).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("backend báo email đã đăng ký: hiện câu tiếng Việt cụ thể, không phải câu chung", async () => {
    // api-client (đã mock) bình thường biến lỗi axios thành ApiError mang chi tiết thật trong `message`.
    mockApi.post.mockRejectedValue(new ApiError(400, "ERR_BAD_REQUEST", "email already registered"));
    renderWithProviders(<RegisterFormPage />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));

    expect(await screen.findByText("Email này đã được đăng ký")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });
});
