/**
 * Q9-PG-05: sai mật khẩu trong hộp thoại xoá tài khoản từng đóng hộp thoại và chỉ còn toast, người dùng phải mở lại và
 * gõ lại. Hộp thoại phải giữ nguyên, lỗi hiện dưới ô mật khẩu; chỉ đóng khi xoá thành công.
 * Q9-PG-06: ô mật khẩu trong hộp thoại đổi mật khẩu / xoá tài khoản có `autocomplete` để trình quản lý mật khẩu hiểu.
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

function openDelete(onDeleteAccount: (password: string) => Promise<void>) {
  renderWithQuery(<AccountSettings user={user} onDeleteAccount={onDeleteAccount} />);
  fireEvent.click(screen.getByRole("button", { name: "Xoá" }));
}

const submit = (password: string) => {
  fireEvent.change(screen.getByLabelText("Mật khẩu xác nhận"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Xoá tài khoản" }));
};

describe("AccountSettings — xoá tài khoản sai mật khẩu (Q9-PG-05)", () => {
  it("sai mật khẩu: hộp thoại vẫn mở, lỗi dưới ô nhập, gõ lại và xoá thành công thì đóng", async () => {
    const onDelete = vi
      .fn<(p: string) => Promise<void>>()
      .mockRejectedValueOnce(new ApiError(400, "ERR_VALIDATION", "incorrect password"))
      .mockResolvedValueOnce(undefined);
    openDelete(onDelete);

    submit("sai-roi");
    expect(await screen.findByText("Mật khẩu không đúng, vui lòng nhập lại")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect((screen.getByLabelText("Mật khẩu xác nhận") as HTMLInputElement).value).toBe("sai-roi");

    submit("dung-roi");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onDelete).toHaveBeenCalledTimes(2);
  });

  it("lỗi không phải mật khẩu (5xx): hộp thoại giữ nguyên, KHÔNG gắn lỗi 'mật khẩu không đúng' vào ô nhập", async () => {
    const onDelete = vi.fn<(p: string) => Promise<void>>().mockRejectedValue(new ApiError(500, "ERR_INTERNAL", "boom"));
    openDelete(onDelete);

    submit("mat-khau");
    await waitFor(() => expect(onDelete).toHaveBeenCalled());
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByText("Mật khẩu không đúng, vui lòng nhập lại")).toBeNull();
  });
});

describe("AccountSettings — autocomplete ô mật khẩu (Q9-PG-06)", () => {
  it("hộp thoại xoá: current-password", () => {
    openDelete(vi.fn());
    expect(screen.getByLabelText("Mật khẩu xác nhận").getAttribute("autocomplete")).toBe("current-password");
  });

  it("hộp thoại đổi mật khẩu: current-password + new-password x2", () => {
    renderWithQuery(<AccountSettings user={user} />);
    fireEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    expect(screen.getByLabelText("Mật khẩu hiện tại").getAttribute("autocomplete")).toBe("current-password");
    expect(screen.getByLabelText("Mật khẩu mới").getAttribute("autocomplete")).toBe("new-password");
    expect(screen.getByLabelText("Xác nhận mật khẩu mới").getAttribute("autocomplete")).toBe("new-password");
  });
});
