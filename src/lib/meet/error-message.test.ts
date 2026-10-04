import { describe, expect, it } from "vitest";
import { MeetApiError } from "./api";
import { meetErrorMessage } from "./error-message";

describe("meetErrorMessage (phòng live)", () => {
  it("409 CLASS_ARCHIVED: hiện message tiếng Việt của backend (nằm ở .code theo quy ước của MeetApiError)", () => {
    const err = new MeetApiError(409, "HTTP 409", "Lớp đã lưu trữ, không nhận bài nộp mới", "CLASS_ARCHIVED");
    expect(meetErrorMessage(err, "Lỗi khi nộp bài")).toBe("Lớp đã lưu trữ, không nhận bài nộp mới");
  });

  it("409 CLASS_ARCHIVED mà message không có tiếng Việt: câu dự phòng, không in 'HTTP 409'", () => {
    const err = new MeetApiError(409, "HTTP 409", "class is archived", "CLASS_ARCHIVED");
    expect(meetErrorMessage(err, "Lỗi khi nộp bài")).toMatch(/Lớp đã lưu trữ/);
  });

  it("lỗi khác giữ hành vi cũ: .message của lỗi", () => {
    expect(meetErrorMessage(new MeetApiError(400, "đã nộp rồi", "x"), "Lỗi khi nộp bài")).toBe("đã nộp rồi");
    expect(meetErrorMessage(new Error("mạng đứt"), "Lỗi khi nộp bài")).toBe("mạng đứt");
    expect(meetErrorMessage(undefined, "Lỗi khi nộp bài")).toBe("Lỗi khi nộp bài");
  });
});
