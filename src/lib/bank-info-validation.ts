/**
 * Kiểm tra thông tin tài khoản nhận tiền của giảng viên (Q8-T04, hợp đồng C20). Cùng luật với backend để người dùng
 * thấy lỗi ngay tại ô nhập thay vì chờ 400/500: tên ngân hàng bắt buộc (<= 100), số tài khoản chỉ gồm chữ số 6-20,
 * tên chủ tài khoản bắt buộc (<= 255). Độ dài tối đa khớp cột `varchar` ở bảng `teacher_profiles`.
 */

export const BANK_NAME_MAX_LENGTH = 100;
export const BANK_ACCOUNT_NUMBER_MIN_LENGTH = 6;
export const BANK_ACCOUNT_NUMBER_MAX_LENGTH = 20;
export const BANK_ACCOUNT_NAME_MAX_LENGTH = 255;

export interface BankInfoInput {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export type BankInfoErrors = Partial<Record<keyof BankInfoInput, string>>;

/** Trả về lỗi theo từng ô (rỗng = hợp lệ). Mọi giá trị được cắt khoảng trắng đầu/cuối trước khi xét. */
export function validateBankInfo(input: BankInfoInput): BankInfoErrors {
  const errors: BankInfoErrors = {};
  const bankName = input.bankName.trim();
  const accountNumber = input.accountNumber.trim();
  const accountName = input.accountName.trim();

  if (!bankName) errors.bankName = "Vui lòng nhập tên ngân hàng.";
  else if (bankName.length > BANK_NAME_MAX_LENGTH) {
    errors.bankName = `Tên ngân hàng tối đa ${BANK_NAME_MAX_LENGTH} ký tự.`;
  }

  if (!accountNumber) errors.accountNumber = "Vui lòng nhập số tài khoản.";
  else if (!/^\d+$/.test(accountNumber)) {
    errors.accountNumber = "Số tài khoản chỉ gồm chữ số, không có khoảng trắng hay ký tự khác.";
  } else if (
    accountNumber.length < BANK_ACCOUNT_NUMBER_MIN_LENGTH ||
    accountNumber.length > BANK_ACCOUNT_NUMBER_MAX_LENGTH
  ) {
    errors.accountNumber = `Số tài khoản phải có từ ${BANK_ACCOUNT_NUMBER_MIN_LENGTH} đến ${BANK_ACCOUNT_NUMBER_MAX_LENGTH} chữ số.`;
  }

  if (!accountName) errors.accountName = "Vui lòng nhập tên chủ tài khoản.";
  else if (accountName.length > BANK_ACCOUNT_NAME_MAX_LENGTH) {
    errors.accountName = `Tên chủ tài khoản tối đa ${BANK_ACCOUNT_NAME_MAX_LENGTH} ký tự.`;
  }

  return errors;
}
