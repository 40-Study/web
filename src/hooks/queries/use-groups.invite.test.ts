import { describe, expect, it } from "vitest";
import { ApiError, ForbiddenError } from "@/lib/errors";
import type { InviteMembersResponse } from "@/services/group.service";
import { inviteErrorMessage, inviteToast, isPartialInvite } from "./use-groups";

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

describe("inviteToast — câu thông báo dựng từ số lượng thật (phase 06)", () => {
  const res = (invited: string[], rejected: { user_id: string; code: string }[], extra: Partial<InviteMembersResponse> = {}): InviteMembersResponse => ({
    message: "english backend message",
    data: { invited, rejected },
    ...extra,
  });

  it("mời trọn vẹn -> success kèm số người", () => {
    expect(inviteToast(res(["a", "b", "c"], []))).toEqual({ level: "success", text: "Đã mời 3 người" });
  });

  it("mời một phần -> warning nói cả số đã mời và số bị từ chối, không dùng message tiếng Anh của backend", () => {
    const t = inviteToast(res(["a"], [{ user_id: "b", code: "GROUP_FULL" }, { user_id: "c", code: "GROUP_FULL" }]));
    expect(t.level).toBe("warning");
    expect(t.text).toBe("Đã mời 1 người, 2 người chưa mời được");
    expect(t.text).not.toContain("english");
  });

  it("200 nhưng không ai vào được (vd. toàn GROUP_ALREADY_MEMBER) -> warning, không phải 'thành công'", () => {
    const t = inviteToast(res([], [{ user_id: "a", code: "GROUP_ALREADY_MEMBER" }]));
    expect(t.level).toBe("warning");
    expect(t.text).toContain("Không mời được ai");
  });

  it("403 toàn NOT_ALLOWED -> error, giữ message tiếng Việt của backend", () => {
    const msg = "Bạn chỉ có thể mời người có quan hệ hợp lệ.";
    const t = inviteToast(res([], [{ user_id: "a", code: "GROUP_INVITE_NOT_ALLOWED" }], { allRejected: true, message: msg }));
    expect(t).toEqual({ level: "error", text: msg });
  });

  it("403 toàn NOT_ALLOWED mà message backend là tiếng Anh -> câu tiếng Việt thay thế", () => {
    const t = inviteToast(res([], [{ user_id: "a", code: "GROUP_INVITE_NOT_ALLOWED" }], { allRejected: true, message: "forbidden" }));
    expect(t.level).toBe("error");
    expect(t.text).toMatch(/quan hệ hợp lệ/);
    expect(t.text).not.toContain("forbidden");
  });
});
