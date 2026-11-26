/** Q8-T04: hộp thoại tài khoản nhận tiền kiểm tra từng ô và chặn gọi API khi dữ liệu sai. */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mutate = vi.fn();
vi.mock("@/hooks/queries/use-wallet", () => ({
  useUpdateBankInfo: () => ({ mutate, isPending: false }),
}));

// eslint-disable-next-line import/first
import { BankInfoDialog } from "./bank-info-dialog";

function renderDialog() {
  return render(
    <BankInfoDialog
      open
      onOpenChange={() => {}}
      currentBankName="Vietcombank"
      currentAccountNumber="0123456789"
      currentAccountName="NGUYEN VAN A"
    />,
  );
}

const save = () => fireEvent.click(screen.getByRole("button", { name: /Lưu thông tin/ }));

describe("BankInfoDialog (Q8-T04)", () => {
  beforeEach(() => mutate.mockReset());

  it("nhãn gắn với ô nhập, số tài khoản là ô số (bàn phím số trên mobile)", () => {
    renderDialog();
    expect((screen.getByLabelText("Số tài khoản") as HTMLInputElement).inputMode).toBe("numeric");
    expect(screen.getByLabelText("Tên ngân hàng")).toBeTruthy();
    expect(screen.getByLabelText("Tên chủ tài khoản")).toBeTruthy();
  });

  it('số tài khoản "abc!!" không gọi API, hiện lý do ngay dưới ô', () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText("Số tài khoản"), { target: { value: "abc!!" } });
    save();
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/chỉ gồm chữ số/);
  });

  it("dán số tài khoản 21 chữ số: ô giữ nguyên giá trị (không cắt lặng lẽ), không gọi API, hiện lý do 6 đến 20 chữ số", () => {
    renderDialog();
    const pasted = "123456789012345678901";
    const input = screen.getByLabelText("Số tài khoản") as HTMLInputElement;
    expect(input.maxLength).toBe(-1);
    fireEvent.change(input, { target: { value: pasted } });
    expect(input.value).toBe(pasted);
    save();
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/từ 6 đến 20 chữ số/);
  });

  it("tên chủ tài khoản toàn khoảng trắng không gọi API", () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText("Tên chủ tài khoản"), { target: { value: "   " } });
    save();
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/Vui lòng nhập tên chủ tài khoản/);
  });

  it("dữ liệu hợp lệ được cắt khoảng trắng rồi gửi đi", () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText("Tên chủ tài khoản"), { target: { value: "  TRAN B  " } });
    save();
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toEqual({
      bank_name: "Vietcombank",
      bank_account_number: "0123456789",
      bank_account_name: "TRAN B",
    });
  });
});
