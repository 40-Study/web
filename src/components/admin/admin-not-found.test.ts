/** Q6 #132 L2: chỉ 404 và 400 ERR_INVALID_ID là "không tìm thấy"; 400 khác và 5xx vẫn là lỗi thật kèm "Thử lại". */
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/errors";
import { isMissingResourceError } from "./admin-not-found";

describe("isMissingResourceError", () => {
  it("404 và 400 ERR_INVALID_ID -> true", () => {
    expect(isMissingResourceError(new ApiError(404, "ERR_NOT_FOUND", "x"))).toBe(true);
    expect(isMissingResourceError(new ApiError(400, "ERR_INVALID_ID", "x"))).toBe(true);
  });

  it("400 mã khác (validate tham số), 5xx, 403, lỗi thường -> false", () => {
    expect(isMissingResourceError(new ApiError(400, "ERR_VALIDATION", "x"))).toBe(false);
    expect(isMissingResourceError(new ApiError(400, "UNKNOWN", "x"))).toBe(false);
    expect(isMissingResourceError(new ApiError(500, "ERR_INTERNAL", "x"))).toBe(false);
    expect(isMissingResourceError(new ApiError(403, "ERR_FORBIDDEN", "x"))).toBe(false);
    expect(isMissingResourceError(new Error("boom"))).toBe(false);
  });
});
