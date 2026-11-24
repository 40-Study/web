/** N-11 (QA4 261123): trang thành công mở thẳng URL từng hiện cho bất kỳ ai. */
import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace, back: vi.fn(), prefetch: vi.fn() }),
}));

import RegisterSuccessPage from "@/app/(auth)/register/success/page";
import ResetPasswordSuccessPage from "@/app/(auth)/reset-password/success/page";
import { markOneShotPage } from "./use-one-shot-page";
import { STORAGE_KEYS } from "@/lib/constants";

beforeEach(() => {
  replace.mockReset();
  sessionStorage.clear();
});

describe.each([
  ["/register/success", RegisterSuccessPage, STORAGE_KEYS.REGISTER_SUCCESS_FLAG, "Bạn đã tạo tài khoản thành công!"],
  ["/reset-password/success", ResetPasswordSuccessPage, STORAGE_KEYS.RESET_PASSWORD_SUCCESS_FLAG, "Đổi mật khẩu thành công!"],
] as const)("%s", (_path, Page, flag, heading) => {
  it("mở thẳng (không có cờ): về /login, không hiện thông báo thành công", async () => {
    render(<Page />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText(heading)).toBeNull();
  });

  it("vừa xong bước trước: hiện một lần (kể cả StrictMode), rồi cờ bị xoá", async () => {
    markOneShotPage(flag);
    render(
      <StrictMode>
        <Page />
      </StrictMode>,
    );
    expect(await screen.findByText(heading)).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
    await waitFor(() => expect(sessionStorage.getItem(flag)).toBeNull());
  });
});
