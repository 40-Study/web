import { describe, expect, it } from "vitest";
import { ApiError } from "./errors";
import { getErrorMessage } from "./error-messages";

describe("getErrorMessage — QA9 khách/phụ huynh", () => {
  it("ERR_ACCOUNT_DELETED (message tiếng Anh) -> câu tiếng Việt riêng, khác ACCOUNT_LOCKED (PG-05)", () => {
    const deleted = getErrorMessage(new ApiError(401, "ERR_ACCOUNT_DELETED", "account deleted"));
    expect(deleted).toBe("Tài khoản đã bị xoá. Liên hệ hỗ trợ nếu muốn khôi phục.");
    expect(deleted).not.toBe(getErrorMessage(new ApiError(401, "ACCOUNT_LOCKED", "locked")));
  });
});
