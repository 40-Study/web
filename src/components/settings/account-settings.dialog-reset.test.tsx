/**
 * Q10-STU-03 / Q10-PG-02: đóng hộp thoại Xoá tài khoản / Đổi mật khẩu bằng Esc, "Huỷ" hay bấm ra ngoài từng giữ nguyên mật
 * khẩu đã gõ và lỗi cũ của trường (mật khẩu nằm lại trong hộp thoại đã đóng, lỗi cũ hiện ở lần mở sau). Phải reset khi đóng.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";
import { useAuthStore } from "@/stores/auth.store";
import { ApiError } from "@/lib/errors";
import { AccountSettings } from "./account-settings";

const user = { email: "a@b.vn", has2FA: false };

beforeEach(() => {
  useAuthStore.setState({ roles: [], activeRole: null, activeUnifiedRole: null });
});

const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

describe("Xoá tài khoản — reset khi đóng (Q10-STU-03)", () => {
  async function wrongPasswordThen(close: () => void) {
    const onDelete = vi.fn<(p: string) => Promise<void>>().mockRejectedValue(new ApiError(400, "ERR_INVALID_PASSWORD", "invalid password"));
    renderWithQuery(<AccountSettings user={user} onDeleteAccount={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }));
    fireEvent.change(field("Mật khẩu xác nhận"), { target: { value: "WrongPass#999" } });
    fireEvent.click(screen.getByRole("button", { name: "Xoá tài khoản" }));
    expect(await screen.findByText("Mật khẩu không đúng, vui lòng nhập lại")).toBeTruthy();

    close();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    fireEvent.click(screen.getByRole("button", { name: "Xoá" }));
    expect(field("Mật khẩu xác nhận").value).toBe("");
    expect(screen.queryByText("Mật khẩu không đúng, vui lòng nhập lại")).toBeNull();
  }

  it("đóng bằng nút Huỷ: ô mật khẩu rỗng và hết lỗi cũ khi mở lại", async () => {
    await wrongPasswordThen(() => fireEvent.click(screen.getByRole("button", { name: "Huỷ" })));
  });

  it("đóng bằng Esc: ô mật khẩu rỗng và hết lỗi cũ khi mở lại", async () => {
    await wrongPasswordThen(() => fireEvent.keyDown(document, { key: "Escape" }));
  });
});

describe("Đổi mật khẩu — reset khi đóng (Q10-PG-02)", () => {
  async function typedThen(close: () => void) {
    renderWithQuery(<AccountSettings user={user} />);
    fireEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    fireEvent.change(field("Mật khẩu hiện tại"), { target: { value: "Sai-lan-hai-2!" } });
    fireEvent.change(field("Mật khẩu mới"), { target: { value: "Moi-123456" } });

    close();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    fireEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    expect(field("Mật khẩu hiện tại").value).toBe("");
    expect(field("Mật khẩu mới").value).toBe("");
  }

  it("đóng bằng nút Huỷ: mọi ô mật khẩu rỗng khi mở lại", async () => {
    await typedThen(() => fireEvent.click(screen.getByRole("button", { name: "Huỷ" })));
  });

  it("đóng bằng Esc: mọi ô mật khẩu rỗng khi mở lại", async () => {
    await typedThen(() => fireEvent.keyDown(document, { key: "Escape" }));
  });
});
