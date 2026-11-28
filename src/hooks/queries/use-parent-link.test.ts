import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it } from "vitest";
import { api } from "@/lib/api-client";
import { ApiError, RateLimitError } from "@/lib/errors";
import { parentLinkService } from "@/services/parent-link.service";
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

// Q11 #149 M1: đi qua api client thật (interceptor dựng RateLimitError), chỉ giả tầng mạng.
describe("parentLinkErrorMessage — 429 qua api client thật", () => {
  const originalAdapter = api.defaults.adapter;
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
  });

  async function sendWith429(body: unknown): Promise<unknown> {
    api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError("request failed", "ERR_BAD_REQUEST", config, undefined, {
        status: 429,
        statusText: "429",
        headers: {},
        config,
        data: body,
      });
    };
    try {
      await parentLinkService.create({ student_email: "hs@example.com", relationship: "parent" });
    } catch (err) {
      return err;
    }
    throw new Error("expected the request to reject");
  }

  it("LINK_REQUEST_DAILY_LIMIT: hiện câu 24 giờ của backend, không phải câu chung", async () => {
    const backendMessage = "Bạn đã gửi tối đa 5 yêu cầu liên kết trong 24 giờ. Vui lòng thử lại sau.";
    const err = await sendWith429({ code: "LINK_REQUEST_DAILY_LIMIT", message: backendMessage });
    expect(err).toBeInstanceOf(RateLimitError);
    expect(parentLinkErrorMessage(err, "x", LINK_REQUEST_RATE_LIMIT_MESSAGE)).toBe(backendMessage);
  });

  it("429 limiter thuần (không code): vẫn dùng câu chung của nơi gọi", async () => {
    const err = await sendWith429({ error: "Too many requests" });
    expect(parentLinkErrorMessage(err, "x", LINK_REQUEST_RATE_LIMIT_MESSAGE)).toBe(LINK_REQUEST_RATE_LIMIT_MESSAGE);
  });
});
