/** backend#143 Q3-09: 400 PAID_COURSE_PRICE_INVALID khi tạo/sửa, 422 COURSE_INCOMPLETE (missing[]) khi gửi duyệt. */
import { describe, expect, it } from "vitest";
import { approvalErrorMessage, missingCourseFields } from "./approval-errors";
import { ApiError, ValidationError } from "./errors";

const incomplete = (missing: unknown, message = "Khoá học thiếu ảnh bìa") =>
  new ValidationError({}, { code: "COURSE_INCOMPLETE", message, payload: { code: "COURSE_INCOMPLETE", message, missing } });

describe("COURSE_INCOMPLETE", () => {
  it("liệt kê từng mục thiếu bằng tiếng Việt", () => {
    const err = incomplete(["thumbnail_url", "description", "price"]);
    expect(missingCourseFields(err)).toEqual(["ảnh bìa", "mô tả", "giá bán"]);
    expect(approvalErrorMessage(err, "fallback")).toBe(
      "Khoá học chưa đủ thông tin để gửi duyệt. Còn thiếu: ảnh bìa, mô tả, giá bán."
    );
  });

  it("chỉ thiếu một mục", () => {
    expect(approvalErrorMessage(incomplete(["price"]), "f")).toBe(
      "Khoá học chưa đủ thông tin để gửi duyệt. Còn thiếu: giá bán."
    );
  });

  it("mục lạ bị bỏ (không in tên field tiếng Anh), thiếu cả danh sách thì chỉ còn câu chung", () => {
    expect(approvalErrorMessage(incomplete(["thumbnail_url", "future_field"]), "f")).toBe(
      "Khoá học chưa đủ thông tin để gửi duyệt. Còn thiếu: ảnh bìa."
    );
    expect(approvalErrorMessage(incomplete(undefined), "f")).toBe("Khoá học chưa đủ thông tin để gửi duyệt.");
  });

  it("lỗi khác không phải COURSE_INCOMPLETE -> null", () => {
    expect(missingCourseFields(new ApiError(400, "OTHER", "x"))).toBeNull();
    expect(missingCourseFields(new Error("x"))).toBeNull();
  });
});

describe("PAID_COURSE_PRICE_INVALID", () => {
  it("ưu tiên câu tiếng Việt của backend", () => {
    expect(approvalErrorMessage(new ApiError(400, "PAID_COURSE_PRICE_INVALID", "Khoá có phí phải có giá lớn hơn 0"), "f")).toBe(
      "Khoá có phí phải có giá lớn hơn 0"
    );
  });

  it("backend gửi tiếng Anh: rơi về câu theo mã", () => {
    expect(approvalErrorMessage(new ApiError(400, "PAID_COURSE_PRICE_INVALID", "price must be > 0"), "f")).toMatch(
      /^Khoá học có phí cần có giá lớn hơn 0/
    );
  });
});
