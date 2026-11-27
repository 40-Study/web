/** QA8 M3: backend #157 đổi 400 INVALID_ID -> ERR_INVALID_ID trên mọi route cuộc thi; cả hai đều là "không tìm thấy cuộc thi". */
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/errors";
import { contestErrorMessage, isContestNotFoundError } from "./contest-errors";

describe("cuộc thi không tìm thấy", () => {
  it.each(["CONTEST_NOT_FOUND", "INVALID_ID", "ERR_INVALID_ID"])("%s -> isContestNotFoundError", (code) => {
    expect(isContestNotFoundError(new ApiError(400, code, "x"))).toBe(true);
  });
  it("mã khác / lỗi thường -> false", () => {
    expect(isContestNotFoundError(new ApiError(400, "CONTEST_FULL", "x"))).toBe(false);
    expect(isContestNotFoundError(new Error("x"))).toBe(false);
  });
  it.each(["INVALID_ID", "ERR_INVALID_ID"])("%s -> câu bắt đầu bằng Không tìm thấy cuộc thi", (code) => {
    expect(contestErrorMessage(new ApiError(400, code, "x"))).toMatch(/^Không tìm thấy cuộc thi/);
  });
});
