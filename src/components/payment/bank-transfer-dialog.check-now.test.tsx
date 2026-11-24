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

// QA4 S8: chưa có tài khoản nhận tiền mà vẫn hiện số TK để sao chép + "Đang chờ xác nhận..." quay vòng,
// ngay cạnh "bạn chưa cần chuyển khoản".
describe("BankTransferDialog — chưa cấu hình tài khoản nhận tiền (S8)", () => {
  it("ẩn số tài khoản, nội dung chuyển khoản, đồng hồ và vòng chờ; chỉ còn cảnh báo", () => {
    renderDialog({ bankName: "MB Bank", accountNumber: "", expiresAt: new Date(Date.now() + 600_000).toISOString() });
    expect(screen.queryByText("FTX123")).toBeNull();
    expect(screen.queryByText(/Đang chờ xác nhận giao dịch/)).toBeNull();
    expect(screen.queryByText(/Hết hạn sau/)).toBeNull();
    expect(screen.queryByRole("button", { name: /Sao chép/ })).toBeNull();
    expect(screen.getByText(/bạn chưa cần chuyển khoản/)).toBeTruthy();
  });

  it("đủ tài khoản: vẫn hiện nội dung chuyển khoản và vòng chờ", () => {
    renderDialog({ bankName: "MB Bank", accountNumber: "0123456789" });
    expect(screen.getByText("FTX123")).toBeTruthy();
    expect(screen.getByText(/Đang chờ xác nhận giao dịch/)).toBeTruthy();
  });
});

