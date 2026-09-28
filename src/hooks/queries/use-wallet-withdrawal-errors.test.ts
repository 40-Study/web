/**
 * Dịch lỗi API rút tiền sang câu tiếng Việt cho toast. Interceptor (api-client.ts) đặt
 * ApiError.message = field `error` của body, tức MÃ LỖI máy đọc (vd "below_minimum").
 */

import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/errors";
import { withdrawalErrorMessage } from "./use-wallet";

describe("withdrawalErrorMessage", () => {
  it("dịch mã lỗi nghiệp vụ", () => {
    expect(withdrawalErrorMessage(new ApiError(400, "ERR", "below_minimum"), "fb")).toMatch(/mức tối thiểu/);
    expect(withdrawalErrorMessage(new ApiError(400, "ERR", "negative_balance"), "fb")).toMatch(/đang âm/);
    expect(withdrawalErrorMessage(new ApiError(409, "ERR", "withdrawal_already_open"), "fb")).toMatch(/chưa xử lý xong/);
    expect(withdrawalErrorMessage(new ApiError(409, "ERR", "invalid_status_transition"), "fb")).toMatch(/đã được xử lý/);
  });

  it("403 của middleware quyền -> câu tiếng Việt, không lộ message kỹ thuật", () => {
    const msg = withdrawalErrorMessage(new ApiError(403, "ERR", "forbidden: missing permission WALLET_WITHDRAWALS_MANAGE"), "fb");
    expect(msg).toBe("Bạn không có quyền thực hiện thao tác này.");
  });

  it("mã lạ hoặc lỗi không phải ApiError -> fallback", () => {
    expect(withdrawalErrorMessage(new ApiError(500, "ERR", "Có lỗi xảy ra"), "fb")).toBe("fb");
    expect(withdrawalErrorMessage(new Error("x"), "fb")).toBe("fb");
  });
});
