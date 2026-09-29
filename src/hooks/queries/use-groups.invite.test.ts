import { describe, expect, it } from "vitest";
import { ApiError, ForbiddenError } from "@/lib/errors";
import { inviteErrorMessage, isPartialInvite } from "./use-groups";

describe("mời thành viên vào nhóm (S2, GROUP_INVITE_NOT_ALLOWED)", () => {
  it("403 hiện đúng thông điệp tiếng Việt của backend", () => {
    const msg = "Bạn chỉ có thể mời người có quan hệ hợp lệ (học viên - giảng viên, phụ huynh - con).";
    expect(inviteErrorMessage(new ForbiddenError(msg))).toBe(msg);
  });

  it("lỗi 500 giữ câu chung, không lộ message thô", () => {
    expect(inviteErrorMessage(new ApiError(500, "UNKNOWN", "internal boom"))).toBe("Không thể mời thành viên");
  });

  it("mời một phần (có rejected) là cảnh báo; mời trọn vẹn thì không", () => {
    expect(isPartialInvite({ data: { rejected: [{ user_id: "u1", code: "GROUP_INVITE_NOT_ALLOWED" }] } })).toBe(true);
    expect(isPartialInvite({ data: { rejected: [] } })).toBe(false);
    expect(isPartialInvite({})).toBe(false);
  });
});