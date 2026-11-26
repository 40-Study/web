import { describe, expect, it } from "vitest";
import { validateBankInfo } from "./bank-info-validation";

const valid = { bankName: "Vietcombank", accountNumber: "0123456789", accountName: "NGUYEN VAN A" };

describe("validateBankInfo (Q8-T04)", () => {
  it("giá trị hợp lệ (kể cả có khoảng trắng đầu/cuối) không có lỗi", () => {
    expect(validateBankInfo(valid)).toEqual({});
    expect(validateBankInfo({ bankName: " MB Bank ", accountNumber: " 123456 ", accountName: " A " })).toEqual({});
  });

  it('số tài khoản "abc!!" và có khoảng trắng bên trong bị từ chối', () => {
    expect(validateBankInfo({ ...valid, accountNumber: "abc!!" }).accountNumber).toMatch(/chỉ gồm chữ số/);
    expect(validateBankInfo({ ...valid, accountNumber: "1234 5678" }).accountNumber).toMatch(/chỉ gồm chữ số/);
  });

  it("số tài khoản 5 chữ số quá ngắn, 21 chữ số quá dài, 6 và 20 vừa đủ", () => {
    expect(validateBankInfo({ ...valid, accountNumber: "12345" }).accountNumber).toMatch(/từ 6 đến 20/);
    expect(validateBankInfo({ ...valid, accountNumber: "1".repeat(21) }).accountNumber).toMatch(/từ 6 đến 20/);
    expect(validateBankInfo({ ...valid, accountNumber: "1".repeat(6) }).accountNumber).toBeUndefined();
    expect(validateBankInfo({ ...valid, accountNumber: "1".repeat(20) }).accountNumber).toBeUndefined();
  });

  it("tên chủ tài khoản toàn khoảng trắng bị từ chối, 256 ký tự quá dài", () => {
    expect(validateBankInfo({ ...valid, accountName: "   " }).accountName).toMatch(/Vui lòng nhập/);
    expect(validateBankInfo({ ...valid, accountName: "A".repeat(256) }).accountName).toMatch(/tối đa 255/);
  });

  it("tên ngân hàng bắt buộc và tối đa 100 ký tự", () => {
    expect(validateBankInfo({ ...valid, bankName: "  " }).bankName).toMatch(/Vui lòng nhập/);
    expect(validateBankInfo({ ...valid, bankName: "B".repeat(101) }).bankName).toMatch(/tối đa 100/);
  });
});
