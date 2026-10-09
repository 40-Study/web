/**
 * Plan 261008 phase 6 step 5 (contract C5): email không có tài khoản học sinh -> backend 404
 * STUDENT_NOT_FOUND với câu tiếng Việt. api-client biến 404 thành NotFoundError mang đúng `message`;
 * form phải hiện câu đó (không câu chung "Không gửi được yêu cầu") và KHÔNG báo thành công.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { toast } from "sonner";
import { LinkChildForm } from "./link-child-form";
import { NotFoundError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const STUDENT_NOT_FOUND_MESSAGE =
  "Không tìm thấy tài khoản học sinh với email này. Hãy kiểm tra lại email hoặc nhờ con đăng ký trước.";

function submit(email: string) {
  fireEvent.change(screen.getByLabelText("Email của con"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: /Gửi yêu cầu liên kết/ }));
}

beforeEach(() => {
  resetMockApi();
  vi.mocked(toast.success).mockClear();
});

describe("LinkChildForm - STUDENT_NOT_FOUND (C5)", () => {
  it("404 hiện câu backend trả trong form, không toast thành công, không xoá email đã nhập", async () => {
    mockApi.post.mockRejectedValue(new NotFoundError(STUDENT_NOT_FOUND_MESSAGE));
    renderWithProviders(<LinkChildForm />);

    submit("khong-co@example.com");

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(STUDENT_NOT_FOUND_MESSAGE);
    expect(mockApi.post).toHaveBeenCalledWith("/family/link-requests", expect.objectContaining({ student_email: "khong-co@example.com" }));
    expect(toast.success).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Email của con") as HTMLInputElement).value).toBe("khong-co@example.com");
  });

  it("đối chứng: thành công thì có toast, xoá email và không có alert", async () => {
    mockApi.post.mockResolvedValue(envelope({ id: "r-1", status: "pending" }));
    renderWithProviders(<LinkChildForm />);

    submit("con@example.com");

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    await waitFor(() => expect((screen.getByLabelText("Email của con") as HTMLInputElement).value).toBe(""));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
