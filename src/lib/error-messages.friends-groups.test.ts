/**
 * Toàn bộ `code` mới của contract bạn bè + nhóm (plans/260930-groups-friends/contract-api.md §1, §2)
 * phải ra câu tiếng Việt cụ thể — không rơi về câu chung theo status hay in mã thô.
 */
import { describe, expect, it } from "vitest";
import { ApiError } from "./errors";
import { HAS_VIETNAMESE_DIACRITICS, getErrorMessage } from "./error-messages";

const FRIEND_CODES: Array<[number, string]> = [
  [400, "FRIEND_SELF_REQUEST"],
  [403, "FRIEND_ROLE_NOT_ALLOWED"],
  [403, "FRIEND_REQUEST_NOT_ALLOWED"],
  [404, "FRIEND_USER_NOT_FOUND"],
  [404, "FRIEND_REQUEST_NOT_FOUND"],
  [404, "FRIEND_NOT_FOUND"],
  [409, "FRIEND_ALREADY_FRIENDS"],
  [409, "FRIEND_REQUEST_EXISTS"],
  [409, "FRIEND_REQUEST_NOT_PENDING"],
  [409, "FRIEND_REQUEST_COOLDOWN"],
  [409, "FRIEND_LIMIT_REACHED"],
  [429, "FRIEND_DAILY_LIMIT_REACHED"],
  [429, "FRIEND_PENDING_LIMIT_REACHED"],
];

const GROUP_CODES: Array<[number, string]> = [
  [400, "GROUP_ALREADY_MEMBER"],
  [400, "GROUP_BANNED"],
  [400, "GROUP_FULL"],
  [400, "GROUP_JOIN_REQUEST_EXISTS"],
  [403, "GROUP_INVITE_NOT_ALLOWED"],
  [400, "GROUP_MEMBER_BANNED"],
];

const STATUS_GENERIC = [
  "Yêu cầu không hợp lệ, vui lòng kiểm tra lại thông tin",
  "Bạn không có quyền thực hiện thao tác này",
  "Không tìm thấy dữ liệu, có thể đã bị xoá",
  "Thao tác xung đột với dữ liệu hiện có",
  "Có lỗi xảy ra, vui lòng thử lại",
];

describe("mã lỗi bạn bè + nhóm -> tiếng Việt cụ thể", () => {
  it.each([...FRIEND_CODES, ...GROUP_CODES])("%i %s", (status, code) => {
    // Message backend là tiếng Anh: bảng phải thắng, không được in message thô.
    const text = getErrorMessage(new ApiError(status, code, "english backend text"));

    expect(HAS_VIETNAMESE_DIACRITICS.test(text)).toBe(true);
    expect(text).not.toContain("english");
    expect(text).not.toContain(code);
    expect(STATUS_GENERIC).not.toContain(text);
  });

  it("code thắng message dù message cũng có tiếng Việt", () => {
    const text = getErrorMessage(new ApiError(409, "FRIEND_REQUEST_COOLDOWN", "Bạn vừa bị từ chối"));
    expect(text).toBe("Bạn chưa thể gửi lời mời cho người này lúc này.");
  });

  it("không lộ lý do riêng tư: cooldown không nói 'từ chối', không-được-phép không nói 'chặn'", () => {
    const cooldown = getErrorMessage(new ApiError(409, "FRIEND_REQUEST_COOLDOWN", ""));
    const notAllowed = getErrorMessage(new ApiError(403, "FRIEND_REQUEST_NOT_ALLOWED", ""));

    expect(cooldown).not.toMatch(/từ chối/i);
    expect(notAllowed).not.toMatch(/chặn/i);
  });

  it("hạn mức hằng ngày nói rõ thử lại ngày mai", () => {
    expect(getErrorMessage(new ApiError(429, "FRIEND_DAILY_LIMIT_REACHED", ""))).toBe(
      "Hôm nay bạn đã gửi đủ lời mời, hãy thử lại vào ngày mai."
    );
  });

  it("câu tiếng Anh cũ của backend (chưa có code) vẫn ra tiếng Việt: pending join request", () => {
    expect(getErrorMessage(new ApiError(400, "UNKNOWN", "you already have a pending join request"))).toBe(
      "Bạn đã gửi yêu cầu tham gia nhóm này, đang chờ duyệt"
    );
  });
});
