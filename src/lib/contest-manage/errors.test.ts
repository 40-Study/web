/**
 * Map lỗi màn quản lý cuộc thi sang tiếng Việt: mã riêng của màn quản lý (ghi đè) + uỷ quyền cho
 * bảng SSOT của W1. Service quản lý dùng `contestRequest` nên 403/404 GIỮ `code` nghiệp vụ.
 */

import { describe, expect, it } from "vitest";

import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { ContestApiError } from "@/services/contest.service";

import { contestErrorMessage } from "./errors";

const FALLBACK = "Không thể thực hiện, thử lại sau.";

describe("contestErrorMessage (quản lý)", () => {
  it("409 CONTEST_NOT_ENDED (chốt sớm) → câu nói rõ mốc 60 giây (ghi đè câu chung của W1)", () => {
    const err = new ContestApiError(409, "CONTEST_NOT_ENDED", "Cuộc thi chưa kết thúc");
    expect(contestErrorMessage(err, FALLBACK)).toBe(
      "Chỉ có thể chốt kết quả sau khi cuộc thi kết thúc ít nhất 60 giây."
    );
  });

  it("404 CONTEST_NOT_FOUND ở màn quản lý (cuộc thi của người khác) → nhắc có thể không phải người tạo", () => {
    const err = new ContestApiError(404, "CONTEST_NOT_FOUND", "Không tìm thấy cuộc thi");
    expect(contestErrorMessage(err, FALLBACK)).toMatch(/không phải người tạo/);
  });

  it("403 CONTEST_FORBIDDEN (sửa/xoá/gửi duyệt cuộc thi của người khác) → tiếng Việt từ bảng W1", () => {
    const err = new ContestApiError(403, "CONTEST_FORBIDDEN", "english");
    expect(contestErrorMessage(err, FALLBACK)).toMatch(/không có quyền/);
  });

  it("409 CONTEST_QUIZ_LOCKED dù message tiếng Anh vẫn ra tiếng Việt", () => {
    const err = new ContestApiError(409, "CONTEST_QUIZ_LOCKED", "quiz is used by an active contest");
    expect(contestErrorMessage(err, FALLBACK)).toMatch(/Không thể sửa bộ câu hỏi/);
  });

  it("409 CONTEST_INVALID_STATUS → nhắc tải lại trang", () => {
    const err = new ContestApiError(409, "CONTEST_INVALID_STATUS", "x");
    expect(contestErrorMessage(err, FALLBACK)).toMatch(/tải lại trang/);
  });

  it("403 từ middleware quyền (tiếng Anh, qua interceptor) → câu tiếng Việt cố định", () => {
    expect(contestErrorMessage(new ForbiddenError("Insufficient permissions"), FALLBACK)).toBe(
      "Bạn không có quyền thực hiện thao tác này."
    );
  });

  it("404 không code (tiếng Anh) → câu tiếng Việt", () => {
    expect(contestErrorMessage(new NotFoundError("Resource not found"), FALLBACK)).toBe("Không tìm thấy dữ liệu.");
  });

  it("400 validate không code → câu chung tiếng Việt", () => {
    const err = new ContestApiError(400, "VALIDATION_FAILED", "Validation failed");
    expect(contestErrorMessage(err, FALLBACK)).toBe("Dữ liệu gửi lên không hợp lệ.");
  });

  it("lỗi lạ không phải ApiError → fallback", () => {
    expect(contestErrorMessage(new Error("boom"), FALLBACK)).toBe(FALLBACK);
  });
});
