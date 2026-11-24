/** Mã lỗi hợp đồng QA4 (giảng viên): backend gửi message tiếng Anh, web phải hiện câu tiếng Việt. */
import { describe, expect, it } from "vitest";
import { ApiError } from "./errors";
import { getErrorMessage } from "./error-messages";

describe("getErrorMessage — mã lỗi QA4 giảng viên", () => {
  it.each([
    [409, "ERR_ASSIGNMENT_HAS_SUBMISSIONS", "đã có học viên nộp bài"],
    [422, "ERR_SESSION_NOT_STARTED", "chưa thể điểm danh"],
    [400, "ERR_DUE_DATE_IN_PAST", "Hạn nộp phải ở tương lai"],
    [409, "COURSE_PENDING_REVIEW", "đang chờ duyệt"],
  ])("%i %s", (status, code, expected) => {
    const message = getErrorMessage(new ApiError(status, code, "Some English backend message"));
    expect(message).toContain(expected);
    expect(message).not.toContain("English");
  });
});
