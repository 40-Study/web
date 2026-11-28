/**
 * Q10-STU-03 (còn lại, Q11): sai mật khẩu xoá tài khoản chỉ được hiện MỘT lần, dưới ô nhập. Test này nối hộp thoại với
 * hook THẬT `useDeleteAccount` và client mang đúng mặc định của app (`createAppQueryClient`, có `mutations.onError` hiện
 * toast): client trần của các test khác không thấy được toast trùng do mặc định gây ra.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppQueryClient } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";
import { ApiError } from "@/lib/errors";

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a), success: vi.fn() } }));
const deleteAccount = vi.fn();
vi.mock("@/services/auth.service", async (orig) => ({
  ...(await orig<typeof import("@/services/auth.service")>()),
  authService: { deleteAccount: (...a: unknown[]) => deleteAccount(...a) },
}));

// eslint-disable-next-line import/first
import { AccountSettings } from "./account-settings";
// eslint-disable-next-line import/first
import { useDeleteAccount } from "@/hooks/queries/use-auth";

const FIELD_MESSAGE = "Mật khẩu không đúng, vui lòng nhập lại";

function Connected() {
  const del = useDeleteAccount();
  return <AccountSettings user={{ email: "a@b.vn", has2FA: false }} onDeleteAccount={async (password) => { await del.mutateAsync({ password }); }} />;
}

beforeEach(() => {
  toastError.mockReset();
  deleteAccount.mockReset();
  useAuthStore.setState({ roles: [], activeRole: null, activeUnifiedRole: null });
});

describe("xoá tài khoản sai mật khẩu — một thông báo duy nhất", () => {
  it.each([
    ["ERR_INVALID_PASSWORD", new ApiError(400, "ERR_INVALID_PASSWORD", "invalid password")],
    ["backend cũ không có code", new ApiError(400, "UNKNOWN", "invalid password")],
  ])("%s: lỗi chỉ dưới ô nhập, không toast", async (_name, error) => {
    deleteAccount.mockRejectedValue(error);
    render(
      <QueryClientProvider client={createAppQueryClient()}>
        <Connected />
      </QueryClientProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }));
    fireEvent.change(screen.getByLabelText("Mật khẩu xác nhận"), { target: { value: "sai-roi" } });
    fireEvent.click(screen.getByRole("button", { name: "Xoá tài khoản" }));

    expect(await screen.findByText(FIELD_MESSAGE)).toBeTruthy();
    await waitFor(() => expect(deleteAccount).toHaveBeenCalled());
    expect(screen.getAllByText(FIELD_MESSAGE)).toHaveLength(1);
    expect(toastError).not.toHaveBeenCalled();
  });
});
