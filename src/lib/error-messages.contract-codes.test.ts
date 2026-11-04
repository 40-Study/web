/** Mã lỗi mới của backend#142/#143: ưu tiên message tiếng Việt của backend, rơi về câu theo mã. */
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { api } from "./api-client";
import { ApiError } from "./errors";
import { getErrorMessage } from "./error-messages";

const CODES: Array<[number, string, string]> = [
  [503, "ERR_LIVE_UNAVAILABLE", "Dịch vụ học trực tuyến hiện chưa sẵn sàng. Vui lòng thử lại sau."],
  [400, "PAID_COURSE_PRICE_INVALID", "Khoá học có phí cần có giá lớn hơn 0. Hãy nhập giá bán hoặc chuyển sang khoá miễn phí."],
  [422, "COURSE_INCOMPLETE", "Khoá học chưa đủ thông tin để gửi duyệt."],
  [409, "ROLE_NAME_TAKEN", "Tên vai trò đã tồn tại trong tổ chức."],
  [409, "ORG_ROLE_ALREADY_ASSIGNED", "Người này đã giữ vai trò đó trong tổ chức."],
  [400, "ERR_INVALID_VOUCHER_CODE", "Mã voucher chỉ gồm chữ in hoa không dấu, chữ số, dấu gạch ngang và gạch dưới."],
];

describe("getErrorMessage — mã lỗi hợp đồng QA3", () => {
  it.each(CODES)("%i %s: ưu tiên câu tiếng Việt của backend", (status, code) => {
    expect(getErrorMessage(new ApiError(status, code, "Câu tiếng Việt riêng của backend, có dấu"))).toBe(
      "Câu tiếng Việt riêng của backend, có dấu"
    );
  });

  it.each(CODES)("%i %s: backend gửi tiếng Anh thì rơi về câu theo mã (không in tiếng Anh)", (status, code, fallback) => {
    expect(getErrorMessage(new ApiError(status, code, "english technical detail"))).toBe(fallback);
  });

  it("503 ERR_LIVE_UNAVAILABLE không bị thay bằng câu chung 'Có lỗi xảy ra'", () => {
    const message = getErrorMessage(new ApiError(503, "ERR_LIVE_UNAVAILABLE", "Dịch vụ học trực tuyến hiện chưa sẵn sàng. Vui lòng thử lại sau khi quản trị viên cấu hình."));
    expect(message).toContain("quản trị viên cấu hình");
  });

  it("503 mã khác vẫn là câu chung, không lộ message backend", () => {
    expect(getErrorMessage(new ApiError(503, "UNKNOWN", "pq: connection refused"))).toBe("Có lỗi xảy ra, vui lòng thử lại");
  });
});

describe("api-client — giữ message của 503 dành cho người dùng", () => {
  function reject(status: number, data: unknown) {
    return (config: InternalAxiosRequestConfig) =>
      Promise.reject(new AxiosError("failed", "ERR_BAD_RESPONSE", config, undefined, { status, statusText: String(status), headers: {}, config, data }));
  }

  it("503 ERR_LIVE_UNAVAILABLE: ApiError mang code và message tiếng Việt của backend", async () => {
    const err = await api
      .post("/livestream/1/join", {}, { adapter: reject(503, { code: "ERR_LIVE_UNAVAILABLE", message: "Dịch vụ học trực tuyến hiện chưa sẵn sàng." }) })
      .catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 503, code: "ERR_LIVE_UNAVAILABLE", message: "Dịch vụ học trực tuyến hiện chưa sẵn sàng." });
    expect(getErrorMessage(err)).toBe("Dịch vụ học trực tuyến hiện chưa sẵn sàng.");
  });

  it("503 mã khác: message backend bị thay bằng câu chung (không lộ chi tiết kỹ thuật)", async () => {
    const err = await api.get("/x", { adapter: reject(503, { code: "DB_DOWN", message: "pq: too many connections" }) }).catch((e) => e);
    expect(err.message).toBe("Có lỗi xảy ra, vui lòng thử lại");
  });
});
