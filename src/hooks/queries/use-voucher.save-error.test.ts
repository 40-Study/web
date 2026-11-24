import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/errors";
import { voucherSaveErrorMessage, VOUCHER_CODE_EXISTS_CODE } from "./use-voucher";

// QA6-A05: mọi 400 khi lưu voucher từng hiện cùng một câu "Mã hoặc tên có thể đã tồn tại". Mỗi lý do giờ có câu riêng.
const FALLBACK = "Không thể tạo voucher, thử lại sau.";

describe("voucherSaveErrorMessage (C9)", () => {
  it("409 ERR_VOUCHER_CODE_EXISTS -> nói là mã trùng", () => {
    // Message cố ý không chứa "code already exists": chỉ nhánh theo MÃ lỗi mới cho ra câu này.
    const msg = voucherSaveErrorMessage(new ApiError(409, VOUCHER_CODE_EXISTS_CODE, "conflict"), FALLBACK);
    expect(msg).toBe("Mã voucher này đã tồn tại, hãy dùng mã khác.");
  });

  it("backend cũ: 400 ERR_CREATE_VOUCHER + 'voucher code already exists' vẫn nói là mã trùng", () => {
    const msg = voucherSaveErrorMessage(new ApiError(400, "ERR_CREATE_VOUCHER", "voucher code already exists"), FALLBACK);
    expect(msg).toBe("Mã voucher này đã tồn tại, hãy dùng mã khác.");
  });

  it("400 ERR_VALIDATION kèm message tiếng Việt nêu đúng trường -> hiện đúng message đó", () => {
    const msg = voucherSaveErrorMessage(new ApiError(400, "ERR_VALIDATION", "Tên voucher tối đa 255 ký tự"), FALLBACK);
    expect(msg).toBe("Tên voucher tối đa 255 ký tự");
  });

  it("400 ERR_INVALID_REQUEST tiếng Anh (backend cũ) -> câu Việt về dữ liệu không hợp lệ, không in tiếng Anh", () => {
    const msg = voucherSaveErrorMessage(new ApiError(400, "ERR_INVALID_REQUEST", "Invalid request body"), FALLBACK);
    expect(msg).toBe("Dữ liệu gửi lên không hợp lệ, vui lòng kiểm tra lại");
  });

  it("lỗi không phải ApiError -> câu dự phòng của nơi gọi", () => {
    expect(voucherSaveErrorMessage(new Error("boom"), FALLBACK)).toBe(FALLBACK);
  });

  it("5xx -> câu dự phòng, không lộ chi tiết máy chủ", () => {
    expect(voucherSaveErrorMessage(new ApiError(500, "UNKNOWN", "pq: deadlock"), FALLBACK)).toBe(FALLBACK);
  });
});
