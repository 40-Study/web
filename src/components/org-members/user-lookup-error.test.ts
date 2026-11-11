/** Backend #146: user-lookup giới hạn tần suất, 429 kèm retry_after. */
import { describe, expect, it } from "vitest";
import { RateLimitError } from "@/lib/errors";
import { userLookupErrorMessage } from "./user-lookup-error";

describe("userLookupErrorMessage — 429", () => {
  it("có retry_after: nói rõ số giây", () => {
    expect(userLookupErrorMessage(new RateLimitError(42))).toBe("Bạn tra cứu quá nhanh, thử lại sau 42 giây.");
  });

  it("không có retry_after: không in số giây", () => {
    expect(userLookupErrorMessage(new RateLimitError())).toBe("Bạn tra cứu quá nhanh, vui lòng đợi một chút rồi thử lại.");
  });
});
