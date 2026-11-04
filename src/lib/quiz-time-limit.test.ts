import { describe, expect, it } from "vitest";
import {
  TIME_LIMIT_CLEAR_UNSUPPORTED_MESSAGE,
  TIME_LIMIT_INVALID_MESSAGE,
  validateTimeLimit,
} from "./quiz-time-limit";

describe("validateTimeLimit (Q3-16)", () => {
  it.each(["1", "30", " 45 ", "600"])("%j hợp lệ", (v) => expect(validateTimeLimit(v, true)).toBeUndefined());
  it.each(["0", "-3", "1.5", "abc", "601", "1e2"])("%j không hợp lệ", (v) =>
    expect(validateTimeLimit(v, false)).toBe(TIME_LIMIT_INVALID_MESSAGE)
  );
  it("xoá trắng: chỉ lỗi khi quiz đang có giới hạn (backend không cho bỏ)", () => {
    expect(validateTimeLimit("", true)).toBe(TIME_LIMIT_CLEAR_UNSUPPORTED_MESSAGE);
    expect(validateTimeLimit("", false)).toBeUndefined();
  });
});
