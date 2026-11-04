/**
 * Backend#143 Q8: "Tôi đã chuyển khoản" ghi nhận `transfer_reported_at`, và việc ghi nhận đó đổi kết quả huỷ đơn lúc
 * ngân hàng lỗi. Nên nút không được bấm khi chưa có tài khoản nhận tiền (học viên chưa thể chuyển khoản).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BankTransferDialog } from "./bank-transfer-dialog";

function renderDialog(props: Partial<React.ComponentProps<typeof BankTransferDialog>> = {}) {
  const onCheckNow = vi.fn();
  render(
    <BankTransferDialog
      open
      onOpenChange={vi.fn()}
      amount={499000}
      paymentContent="FTX123"
      status="pending"
      onCheckNow={onCheckNow}
      {...props}
    />
  );
  return { onCheckNow };
}

describe("BankTransferDialog — nút 'Tôi đã chuyển khoản'", () => {
  it("chưa cấu hình tài khoản nhận tiền: nút bị khoá, bấm không gọi onCheckNow, vẫn hiện cảnh báo", () => {
    const { onCheckNow } = renderDialog({ bankName: undefined, accountNumber: undefined });
    const button = screen.getByRole("button", { name: "Tôi đã chuyển khoản" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onCheckNow).not.toHaveBeenCalled();
    expect(screen.getByText(/Chưa cấu hình đầy đủ tài khoản nhận tiền/)).toBeTruthy();
  });

  it("thiếu số tài khoản (chỉ có tên ngân hàng): vẫn khoá, cùng điều kiện với dòng cảnh báo", () => {
    renderDialog({ bankName: "MB Bank", accountNumber: "" });
    expect((screen.getByRole("button", { name: "Tôi đã chuyển khoản" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("đủ ngân hàng + số tài khoản: nút dùng được và gọi onCheckNow", () => {
    const { onCheckNow } = renderDialog({ bankName: "MB Bank", accountNumber: "0123456789", accountName: "FORTEX" });
    const button = screen.getByRole("button", { name: "Tôi đã chuyển khoản" }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(onCheckNow).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Chưa cấu hình đầy đủ tài khoản nhận tiền/)).toBeNull();
  });
});
