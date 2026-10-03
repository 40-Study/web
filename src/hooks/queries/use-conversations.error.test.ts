import { describe, expect, it } from "vitest";
import { ApiError, ForbiddenError } from "@/lib/errors";
import { createDirectErrorMessage } from "./use-conversations";

describe("createDirectErrorMessage", () => {
  it("hiện đúng message tiếng Việt của backend khi bị chặn 403", () => {
    const msg = "Bạn chỉ có thể nhắn tin với giảng viên của khoá bạn đang học, phụ huynh hoặc con đã liên kết, hoặc quản trị viên";
    expect(createDirectErrorMessage(new ForbiddenError(msg))).toBe(msg);
  });

  it("nơi gọi cho câu riêng (phụ huynh nhắn giảng viên) thì 403 hiện câu đó, lỗi khác không bị đè", () => {
    const custom = "Giảng viên này chưa dạy lớp hoặc khoá mà con bạn đang học";
    expect(createDirectErrorMessage(new ForbiddenError("Bạn chỉ có thể nhắn tin với ..."), custom)).toBe(custom);
    expect(createDirectErrorMessage(new ApiError(500, "UNKNOWN", "boom"), custom)).toBe("Không thể tạo cuộc trò chuyện");
  });

  it("lỗi khác (500, mạng) giữ câu chung, không lộ message thô", () => {
    expect(createDirectErrorMessage(new ApiError(500, "UNKNOWN", "internal boom"))).toBe(
      "Không thể tạo cuộc trò chuyện"
    );
    expect(createDirectErrorMessage(new Error("Network Error"))).toBe("Không thể tạo cuộc trò chuyện");
  });
});
