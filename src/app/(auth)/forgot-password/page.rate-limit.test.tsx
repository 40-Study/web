/** Q5-PG-07: yêu cầu mã bị 429 từng ném "uncaught (in promise)" (RateLimitError) ra console. */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));

import ForgotPasswordPage from "./page";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import { RateLimitError } from "@/lib/errors";
import { createAppQueryClient } from "@/lib/query-client";
import { toast } from "sonner";

beforeEach(() => {
  resetMockApi();
  vi.mocked(toast.error).mockClear();
});

describe("ForgotPasswordPage — 429", () => {
  it("không để lỗi rơi thành unhandled rejection và không chuyển sang bước OTP", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    mockApi.post.mockRejectedValue(new RateLimitError(100));
    // Client THẬT của app: toast 429 duy nhất đến từ mutations.onError mặc định (hook không có onError riêng).
    renderWithProviders(<ForgotPasswordPage />, { queryClient: createAppQueryClient() });

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.vn" } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi mã xác thực" }));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 20));
    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Gửi mã xác thực" })).toBeTruthy();
    // Người dùng PHẢI thấy vì sao không đi tiếp được, đúng một lần, kèm số giây chờ (review M2).
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Không thể thực hiện thao tác", {
      description: "Bạn thao tác quá nhiều lần, vui lòng thử lại sau 100 giây",
    });
  });
});
