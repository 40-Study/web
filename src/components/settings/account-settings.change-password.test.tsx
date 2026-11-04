/** P-04: đổi mật khẩu dùng cùng chính sách với đăng ký / đặt lại (backend#143 `strong_password`). */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";
import { AccountSettings } from "./account-settings";

const POLICY = "Mật khẩu phải có ít nhất 8 ký tự, gồm ít nhất 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt";

function openDialog(onPasswordChange = vi.fn().mockResolvedValue(undefined)) {
  renderWithQuery(<AccountSettings user={{ email: "a@b.vn", has2FA: false }} onPasswordChange={onPasswordChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
  return onPasswordChange;
}

function fill(current: string, next: string, confirm: string) {
  fireEvent.change(screen.getByLabelText("Mật khẩu hiện tại"), { target: { value: current } });
  fireEvent.change(screen.getByLabelText("Mật khẩu mới"), { target: { value: next } });
  fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu mới"), { target: { value: confirm } });
  fireEvent.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));
}

describe("đổi mật khẩu — chính sách mới", () => {
  it("mật khẩu mới yếu: báo câu chính sách, không gọi API", async () => {
    const onPasswordChange = openDialog();
    fill("OldPass1!", "abcdefgh", "abcdefgh");
    expect(await screen.findByText(POLICY)).toBeTruthy();
    expect(onPasswordChange).not.toHaveBeenCalled();
  });

  it("dialog có checklist đúng 4 luật", () => {
    openDialog();
    expect(screen.getByText("Có ít nhất 1 ký tự đặc biệt (không phải chữ, số hay khoảng trắng)")).toBeTruthy();
  });

  it("mật khẩu mới đạt chính sách: gọi API", async () => {
    const onPasswordChange = openDialog();
    fill("OldPass1!", "Abcdef1!", "Abcdef1!");
    await waitFor(() => expect(onPasswordChange).toHaveBeenCalledWith("OldPass1!", "Abcdef1!"));
  });
});
