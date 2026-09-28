/**
 * Map lỗi API cuộc thi sang tiếng Việt. `api-client` làm mất `code` của 403/404 (chỉ còn message),
 * nên 403 CONTEST_FORBIDDEN dựa vào message tiếng Việt của backend, còn 403 từ middleware quyền
 * (tiếng Anh) phải rơi về câu tiếng Việt cố định — không bao giờ hiện tiếng Anh cho người dùng.
 */

import { describe, expect, it } from "vitest";

import { ApiError, ForbiddenError, NotFoundError } from "@/lib/errors";

import { contestErrorMessage } from "./errors";

const FALLBACK = "Không thể thực hiện, thử lại sau.";

describe("contestErrorMessage", () => {
  it("409 CONTEST_NOT_ENDED (chốt sớm) → câu tiếng Việt về mốc 60 giây", () => {
    const err = new ApiError(409, "CONTEST_NOT_ENDED", "Cuộc thi chưa kết thúc");
    expect(contestErrorMessage(err, FALLBACK)).toBe(
      "Chỉ có thể chốt kết quả sau khi cuộc thi kết thúc ít nhất 60 giây."
    );
  });

  it("409 CONTEST_QUIZ_LOCKED dù message tiếng Anh vẫn ra tiếng Việt (tra theo code)", () => {
    const err = new ApiError(409, "CONTEST_QUIZ_LOCKED", "quiz is used by an active contest");
    expect(contestErrorMessage(err, FALLBACK)).toMatch(/không thể sửa/);
  });

  it("409 CONTEST_INVALID_STATUS → nhắc tải lại trang", () => {
    const err = new ApiError(409, "CONTEST_INVALID_STATUS", "Trạng thái cuộc thi không cho phép thao tác này");
    expect(contestErrorMessage(err, FALLBACK)).toMatch(/tải lại trang/);
  });

  it("403 CONTEST_FORBIDDEN (sửa/xoá/gửi duyệt cuộc thi của người khác) → message tiếng Việt của backend", () => {
    const err = new ForbiddenError("Bạn không có quyền với cuộc thi này");
    expect(contestErrorMessage(err, FALLBACK)).toBe("Bạn không có quyền với cuộc thi này");
  });

  it("403 từ middleware quyền (tiếng Anh) → câu tiếng Việt cố định", () => {
    const err = new ForbiddenError("Insufficient permissions");
    expect(contestErrorMessage(err, FALLBACK)).toBe("Bạn không có quyền thực hiện thao tác này.");
  });

  it("404 (xem bản quản lý cuộc thi của người khác) tiếng Anh → câu tiếng Việt", () => {
    expect(contestErrorMessage(new NotFoundError("Resource not found"), FALLBACK)).toMatch(
      /^Không tìm thấy cuộc thi/
    );
  });

  it("400 Validation failed (không code) → câu chung tiếng Việt, không lộ tiếng Anh", () => {
    const err = new ApiError(400, "UNKNOWN", "Validation failed");
    expect(contestErrorMessage(err, FALLBACK)).toBe(
      "Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại các trường đã nhập."
    );
  });

  it("lỗi lạ không phải ApiError → fallback", () => {
    expect(contestErrorMessage(new Error("boom"), FALLBACK)).toBe(FALLBACK);
  });
});
