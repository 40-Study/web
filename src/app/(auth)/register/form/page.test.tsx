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
    // N-07 (QA4 261123): không còn mật khẩu dạng rõ nào nằm lại trong sessionStorage.
    for (let i = 0; i < sessionStorage.length; i++) {
      expect(sessionStorage.getItem(sessionStorage.key(i)!)).not.toContain("Abcdef12#");
    }
  });

  // N-01 (QA4 261123): luật mật khẩu từng chỉ hiện thành một câu lỗi chung sau khi bấm gửi.
  it("hiện danh sách luật mật khẩu và đánh dấu từng luật khi gõ", () => {
    renderWithProviders(<RegisterFormPage />);
    expect(screen.getByText("Có ít nhất 1 chữ in hoa").className).toContain("text-muted-foreground");
    fill("Mật khẩu", "Abcdefgh");
    expect(screen.getByText("Có ít nhất 1 chữ in hoa").className).toContain("text-green-700");
    expect(screen.getByText("Có ít nhất 1 chữ số").className).toContain("text-muted-foreground");
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

  // Contract 8: /otp nhận 410 (đăng ký đang chờ đã hết hạn) thì quay về đây với email điền sẵn, một lần.
  it("điền sẵn email từ đăng ký hết hạn rồi xoá khoá tạm", async () => {
    sessionStorage.setItem(STORAGE_KEYS.REGISTER_PREFILL_EMAIL, "qa@example.com");
    renderWithProviders(<RegisterFormPage />);
    await waitFor(() => expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("qa@example.com"));
    expect(sessionStorage.getItem(STORAGE_KEYS.REGISTER_PREFILL_EMAIL)).toBeNull();
  });

  it("mở trang: xoá khoá cũ register_payload (review web#123 #4)", async () => {
    sessionStorage.setItem("register_payload", '{"password":"x"}');
    renderWithProviders(<RegisterFormPage />);
    await waitFor(() => expect(sessionStorage.getItem("register_payload")).toBeNull());
  });
});

describe("/register/form — QA8 khách", () => {
  it("Q8-PG-01: email gõ HOA/có khoảng trắng được gửi và lưu ở dạng chữ thường", async () => {
    mockApi.post.mockResolvedValue({ data: { message: "OTP sent" } });
    renderWithProviders(<RegisterFormPage />);

    fillValidForm();
    fill("Email", "  QAGuest86464@Example.COM ");
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
    expect(mockApi.post.mock.calls[0][1]).toMatchObject({ email: "qaguest86464@example.com" });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/otp"));
    expect(sessionStorage.getItem(STORAGE_KEYS.REGISTER_EMAIL)).toBe("qaguest86464@example.com");
  });

  it("Q8-PG-02: 409 ERR_USERNAME_EXISTS hiện dưới ô Tên đăng nhập, không phải câu chung 'Đăng ký thất bại'", async () => {
    mockApi.post.mockRejectedValue(new ApiError(409, "ERR_USERNAME_EXISTS", "username already exists"));
    renderWithProviders(<RegisterFormPage />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));

    const error = await screen.findByText(/Tên đăng nhập đã được dùng/);
    expect(screen.getByLabelText("Tên đăng nhập").getAttribute("aria-invalid")).toBe("true");
    expect(error.id).toBe(`${screen.getByLabelText("Tên đăng nhập").id}-error`);
    expect(screen.queryByText(/Đăng ký thất bại/)).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });

  it("Q8-PG-07: Họ/Tên quá dài bị chặn ở ô, không gửi request", async () => {
    renderWithProviders(<RegisterFormPage />);

    fillValidForm();
    fill("Họ", "N".repeat(150));
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));

    expect(await screen.findByText("Họ tối đa 100 ký tự")).toBeTruthy();
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it("Q8-PG-07: 400 tiếng Anh của backend (full_name) hiện thành lỗi tiếng Việt dưới ô Họ", async () => {
    const body = { errors: [{ field: "full_name", message: "full_name must be at most 255 characters" }], message: "Validation failed" };
    mockApi.post.mockRejectedValue(new ApiError(400, "UNKNOWN", "Validation failed", undefined, body));
    renderWithProviders(<RegisterFormPage />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));

    expect(await screen.findByText(/Họ và tên không hợp lệ/)).toBeTruthy();
    expect(screen.queryByText(/must be at most/)).toBeNull();
    expect(screen.queryByText(/Đăng ký thất bại/)).toBeNull();
  });

  it("Q8-PG-08: các ô có autocomplete đúng cho trình quản lý mật khẩu / tự điền", () => {
    renderWithProviders(<RegisterFormPage />);
    const ac = (label: string) => screen.getByLabelText(label).getAttribute("autocomplete");
    expect(ac("Tên đăng nhập")).toBe("username");
    expect(ac("Họ")).toBe("family-name");
    expect(ac("Tên")).toBe("given-name");
    expect(ac("Email")).toBe("email");
    expect(ac("Mật khẩu")).toBe("new-password");
    expect(ac("Xác nhận mật khẩu")).toBe("new-password");
  });
});
