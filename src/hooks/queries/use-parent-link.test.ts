import { describe, expect, it } from "vitest";
import { ApiError, RateLimitError } from "@/lib/errors";
import { LINK_REQUEST_RATE_LIMIT_MESSAGE, parentLinkErrorMessage } from "./use-parent-link";

describe("parentLinkErrorMessage", () => {
  it("giữ thông điệp tiếng Việt backend trả cho lỗi 4xx (vd đã gửi yêu cầu)", () => {
    const err = new ApiError(409, "LINK_REQUEST_PENDING", "Bạn đã gửi yêu cầu cho học sinh này, vui lòng chờ con xác nhận.");
    expect(parentLinkErrorMessage(err, "x")).toBe("Bạn đã gửi yêu cầu cho học sinh này, vui lòng chờ con xác nhận.");
  });

  it("429 (api-client bỏ body, câu tiếng Anh) được dịch sang tiếng Việt", () => {
    const msg = parentLinkErrorMessage(new RateLimitError(), "x", LINK_REQUEST_RATE_LIMIT_MESSAGE);
    expect(msg).toContain("quá nhiều yêu cầu liên kết");
    expect(msg).not.toMatch(/Too many/);
  });

  it("429 ở thao tác khác (huỷ, trả lời) dùng câu chung, không nói về gửi yêu cầu (W5)", () => {
    const msg = parentLinkErrorMessage(new RateLimitError(), "x");
    expect(msg).not.toContain("yêu cầu liên kết");
    expect(msg).not.toMatch(/Too many/);
  });

  it("lỗi 5xx hoặc không rõ dùng thông điệp dự phòng", () => {
    expect(parentLinkErrorMessage(new ApiError(500, "X", "internal"), "Có lỗi")).toBe("Có lỗi");
    expect(parentLinkErrorMessage(new Error("boom"), "Có lỗi")).toBe("Có lỗi");
  });
});
