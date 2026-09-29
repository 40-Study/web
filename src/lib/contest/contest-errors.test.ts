/**
 * Lỗi `CONTEST_*` (contract §2.4) -> câu tiếng Việt. Mọi mã phải có bản dịch riêng, không rơi về
 * câu chung chung hay message tiếng Anh của backend.
 */
import { describe, expect, it } from "vitest";
import { ApiError, AuthError, ForbiddenError, NetworkError, RateLimitError } from "@/lib/errors";
import { ContestApiError } from "@/services/contest.service";
import { CONTEST_ERROR_CODES } from "@/types/contest";
import { CONTEST_ERROR_MESSAGES, contestErrorCode, contestErrorMessage } from "./contest-errors";

const VIETNAMESE = /[à-ỹÀ-Ỹđ]/;

describe("contestErrorMessage", () => {
  it.each(CONTEST_ERROR_CODES.map((c) => [c]))("%s -> câu tiếng Việt riêng", (code) => {
    const msg = contestErrorMessage(new ContestApiError(409, code, "english backend message"));
    expect(msg).toBe(CONTEST_ERROR_MESSAGES[code]);
    expect(msg).toMatch(VIETNAMESE);
    expect(msg).not.toContain("english backend message");
  });

  it("các câu dịch không trùng nhau (mỗi mã nói đúng lý do của nó)", () => {
    const messages = Object.values(CONTEST_ERROR_MESSAGES);
    expect(new Set(messages).size).toBe(messages.length);
  });

  it("mã cụ thể từng dùng ở UI", () => {
    expect(contestErrorMessage(new ContestApiError(403, "CONTEST_COURSE_REQUIRED", ""))).toContain("mua khoá");
    expect(contestErrorMessage(new ContestApiError(409, "CONTEST_DEADLINE_PASSED", ""))).toContain("hết thời gian");
    expect(contestErrorMessage(new ContestApiError(409, "CONTEST_FULL", ""))).toContain("đủ số người");
  });

  it("không có mã nghiệp vụ -> câu chung theo status, không lộ message tiếng Anh", () => {
    expect(contestErrorMessage(new ForbiddenError("Insufficient permissions"))).toBe("Bạn không có quyền thực hiện thao tác này.");
    expect(contestErrorMessage(new AuthError("Invalid token"))).toContain("đăng nhập lại");
    expect(contestErrorMessage(new ApiError(404, "NOT_FOUND", "Cannot GET"))).toBe("Không tìm thấy dữ liệu.");
    expect(contestErrorMessage(new ApiError(500, "UNKNOWN", "pq: relation"))).toBe("Có lỗi xảy ra, vui lòng thử lại.");
    expect(contestErrorMessage(new NetworkError())).toBe("Có lỗi xảy ra, vui lòng thử lại.");
    expect(contestErrorMessage(new RateLimitError(30))).toContain("30 giây");
    expect(contestErrorMessage(new Error("boom"), "Dự phòng")).toBe("Dự phòng");
  });

  it("contestErrorCode đọc code từ ApiError, null với lỗi khác", () => {
    expect(contestErrorCode(new ContestApiError(409, "CONTEST_FULL", ""))).toBe("CONTEST_FULL");
    expect(contestErrorCode(new Error("x"))).toBeNull();
  });
});
