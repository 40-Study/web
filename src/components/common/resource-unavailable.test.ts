/** #134 L-3: chỉ 400 "id sai định dạng" là không-tìm-thấy; một 400 khác (tham số truy vấn) vẫn là lỗi thật. */
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/errors";
import { isInvalidResourceIdError } from "./resource-unavailable";

describe("isInvalidResourceIdError", () => {
  it("400 ERR_INVALID_ID và 400 body cũ 'invalid id' (không code) -> true", () => {
    expect(isInvalidResourceIdError(new ApiError(400, "ERR_INVALID_ID", "x"))).toBe(true);
    expect(isInvalidResourceIdError(new ApiError(400, "", "invalid id"))).toBe(true);
    expect(isInvalidResourceIdError(new ApiError(400, "UNKNOWN", "Invalid ID"))).toBe(true);
  });

  it("400 khác (validate, tham số), 5xx, 404, lỗi thường -> false", () => {
    expect(isInvalidResourceIdError(new ApiError(400, "ERR_VALIDATION", "page_size must be positive"))).toBe(false);
    expect(isInvalidResourceIdError(new ApiError(400, "", "invalid page"))).toBe(false);
    expect(isInvalidResourceIdError(new ApiError(500, "ERR_INTERNAL", "invalid id"))).toBe(false);
    expect(isInvalidResourceIdError(new ApiError(404, "ERR_NOT_FOUND", "x"))).toBe(false);
    expect(isInvalidResourceIdError(new Error("invalid id"))).toBe(false);
  });
});
