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

beforeEach(() => resetMockApi());

describe("ForgotPasswordPage — 429", () => {
  it("không để lỗi rơi thành unhandled rejection và không chuyển sang bước OTP", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    mockApi.post.mockRejectedValue(new RateLimitError(100));
    renderWithProviders(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.vn" } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi mã xác thực" }));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 20));
    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Gửi mã xác thực" })).toBeTruthy();
  });
});
