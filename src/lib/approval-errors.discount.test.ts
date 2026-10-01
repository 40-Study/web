import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/errors";
import { approvalErrorMessage } from "./approval-errors";

describe("approvalErrorMessage — DISCOUNT_PRICE_INVALID (L1)", () => {
  it("backend trả 400 DISCOUNT_PRICE_INVALID (message tiếng Anh) -> câu tiếng Việt hướng dẫn bỏ trống để xoá", () => {
    const err = new ApiError(400, "DISCOUNT_PRICE_INVALID", "discount_price must be greater than 0 and less than price");
    const msg = approvalErrorMessage(err, "fallback");
    expect(msg).toContain("lớn hơn 0 và thấp hơn giá bán");
    expect(msg).toContain("để trống");
  });
});
