/**
 * inviteMembers chuẩn hoá kết quả mời. Interceptor chung đổi mọi 403 thành ForbiddenError và bỏ body,
 * làm mất `rejected`; service phải tự nhận 403-kèm-danh-sách (contract §2) mà không nuốt 403 thường.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/errors";

vi.mock("@/lib/api-client", () => ({ api: { post: vi.fn() } }));

import { api } from "@/lib/api-client";
import { groupService } from "./group.service";

const reply = (status: number, data: unknown) => vi.mocked(api.post).mockResolvedValue({ status, data } as never);

describe("groupService.inviteMembers", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it("200 (mời một phần): trả nguyên message + data, không có cờ allRejected", async () => {
    const data = { invited: ["u1"], rejected: [{ user_id: "u2", code: "GROUP_FULL" }] };
    reply(200, { message: "ok", data });

    const res = await groupService.inviteMembers("g1", ["u1", "u2"]);

    expect(res.data).toEqual(data);
    expect(res.allRejected).toBeUndefined();
    expect(api.post).toHaveBeenCalledWith("/groups/g1/members/invite", { user_ids: ["u1", "u2"] }, expect.anything());
  });

  it("200 với invited rỗng vẫn là kết quả (web hiểu qua rejected), không phải lỗi", async () => {
    reply(200, { message: "ok", data: { invited: [], rejected: [{ user_id: "u1", code: "GROUP_ALREADY_MEMBER" }] } });
    const res = await groupService.inviteMembers("g1", ["u1"]);
    expect(res.data.invited).toEqual([]);
    expect(res.data.rejected).toHaveLength(1);
  });

  it("403 kèm data.rejected: RESOLVE với allRejected=true và đủ danh sách (không mất `rejected`)", async () => {
    const rejected = [{ user_id: "u1", code: "GROUP_INVITE_NOT_ALLOWED" }];
    reply(403, { message: "Bạn chỉ có thể mời người có quan hệ hợp lệ", code: "GROUP_INVITE_NOT_ALLOWED", data: { invited: [], rejected } });

    const res = await groupService.inviteMembers("g1", ["u1"]);

    expect(res.allRejected).toBe(true);
    expect(res.data.rejected).toEqual(rejected);
    expect(res.data.invited).toEqual([]);
    expect(res.message).toBe("Bạn chỉ có thể mời người có quan hệ hợp lệ");
  });

  it("403 thường (không đủ quyền, không có danh sách): vẫn ném ForbiddenError với thông điệp backend", async () => {
    reply(403, { message: "Bạn không có quyền mời thành viên" });

    const err = await groupService.inviteMembers("g1", ["u1"]).catch((e) => e);

    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.message).toBe("Bạn không có quyền mời thành viên");
  });

  it("chỉ 2xx và 403 được coi là phản hồi; 404/400/500 vẫn đi qua interceptor", async () => {
    reply(200, { message: "ok", data: { invited: [], rejected: [] } });
    await groupService.inviteMembers("g1", ["u1"]);

    const config = vi.mocked(api.post).mock.calls[0][2] as { validateStatus: (s: number) => boolean };
    expect([200, 201, 403].every(config.validateStatus)).toBe(true);
    expect([400, 401, 404, 409, 500].some(config.validateStatus)).toBe(false);
  });
});
