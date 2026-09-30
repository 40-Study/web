import { describe, expect, it } from "vitest";
import { UNKNOWN_REJECTION_REASON, rejectionReason } from "./rejection-reason";

describe("rejectionReason — lý do từ chối khi mời vào nhóm (contract §2)", () => {
  it.each([
    ["GROUP_INVITE_NOT_ALLOWED", "Chưa có quan hệ để mời"],
    ["GROUP_MEMBER_BANNED", "Đang bị cấm khỏi nhóm"],
    ["GROUP_FULL", "Nhóm đã đầy"],
    ["GROUP_ALREADY_MEMBER", "Đã trong nhóm"],
  ])("%s -> %s", (code, expected) => {
    expect(rejectionReason(code)).toBe(expected);
  });

  it("mã lạ: câu tiếng Việt chung, không in mã thô", () => {
    const text = rejectionReason("GROUP_SOMETHING_NEW");
    expect(text).toBe(UNKNOWN_REJECTION_REASON);
    expect(text).not.toContain("GROUP_");
  });
});
