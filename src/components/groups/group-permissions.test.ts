/**
 * Ma trận quyền UI của trang nhóm (phase 03): mỗi ô của bảng "nút hành động theo (privacy, trạng thái
 * người xem)" và của ma trận OWNER/ADMIN/MODERATOR/MEMBER có một assertion riêng. Sửa điều kiện ở
 * group-permissions.ts thì test tương ứng phải đỏ.
 */
import { describe, expect, it } from "vitest";
import type { Group } from "@/services/group.service";
import {
  assignableRoles,
  canAdminister,
  canDeleteGroup,
  canInvite,
  canManageMember,
  canSeeChat,
  canSeeMembers,
  getManageSections,
  getPrimaryAction,
} from "./group-permissions";

function makeGroup(over: Partial<Group> = {}): Group {
  return {
    id: "g1",
    name: "Nhóm React",
    slug: "nhom-react",
    type: "STUDY_GROUP",
    privacy: "PUBLIC",
    max_members: 50,
    member_count: 5,
    created_by: "owner",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
    ...over,
  };
}

describe("getPrimaryAction — nút chính theo (privacy, trạng thái người xem)", () => {
  it("chưa vào + PUBLIC -> Tham gia", () => {
    expect(getPrimaryAction(makeGroup({ privacy: "PUBLIC" }))).toBe("join");
  });

  it("chưa vào + PRIVATE + chưa có yêu cầu -> Xin tham gia", () => {
    expect(getPrimaryAction(makeGroup({ privacy: "PRIVATE" }))).toBe("request");
  });

  it("chưa vào + PRIVATE + đã có my_join_request -> Đã gửi yêu cầu (không cho gửi lại)", () => {
    const g = makeGroup({ privacy: "PRIVATE", my_join_request: { id: "r1", status: "PENDING" } });
    expect(getPrimaryAction(g)).toBe("requested");
  });

  it("chưa vào + SECRET -> không có nút nào", () => {
    expect(getPrimaryAction(makeGroup({ privacy: "SECRET" }))).toBeNull();
  });

  it.each(["ADMIN", "MODERATOR", "MEMBER"])("thành viên %s -> Rời nhóm", (role) => {
    expect(getPrimaryAction(makeGroup({ my_role: role }))).toBe("leave");
  });

  it("chủ nhóm -> KHÔNG có Rời nhóm (backend chặn, chưa có chuyển quyền)", () => {
    expect(getPrimaryAction(makeGroup({ my_role: "OWNER" }))).toBeNull();
    expect(getPrimaryAction(makeGroup({ my_role: "OWNER", privacy: "PRIVATE" }))).toBeNull();
  });

  it("đã là thành viên thì my_join_request không còn ý nghĩa", () => {
    const g = makeGroup({ privacy: "PRIVATE", my_role: "MEMBER", my_join_request: { id: "r", status: "PENDING" } });
    expect(getPrimaryAction(g)).toBe("leave");
  });
});

describe("quyền theo vai trò", () => {
  it("chỉ OWNER/ADMIN/MODERATOR mời và duyệt yêu cầu", () => {
    expect(["OWNER", "ADMIN", "MODERATOR", "MEMBER", undefined].map(canInvite)).toEqual([true, true, true, false, false]);
  });

  it("chỉ OWNER/ADMIN quản trị (đổi vai, cấm, cài đặt)", () => {
    expect(["OWNER", "ADMIN", "MODERATOR", "MEMBER", undefined].map(canAdminister)).toEqual([true, true, false, false, false]);
  });

  it("chỉ OWNER xoá nhóm", () => {
    expect(["OWNER", "ADMIN", "MODERATOR", "MEMBER"].map(canDeleteGroup)).toEqual([true, false, false, false]);
  });
});

describe("tab Thành viên / Trò chuyện", () => {
  it("người ngoài chỉ xem được danh sách thành viên của nhóm PUBLIC (Q10)", () => {
    expect(canSeeMembers({ my_role: undefined, privacy: "PUBLIC" })).toBe(true);
    expect(canSeeMembers({ my_role: undefined, privacy: "PRIVATE" })).toBe(false);
    expect(canSeeMembers({ my_role: undefined, privacy: "SECRET" })).toBe(false);
  });

  it("thành viên luôn xem được danh sách", () => {
    expect(canSeeMembers({ my_role: "MEMBER", privacy: "PRIVATE" })).toBe(true);
  });

  it("chat chỉ cho thành viên có conversation", () => {
    expect(canSeeChat({ my_role: "MEMBER", conversation: { id: "c1" } })).toBe(true);
    expect(canSeeChat({ my_role: "MEMBER", conversation: undefined })).toBe(false);
    expect(canSeeChat({ my_role: undefined, conversation: { id: "c1" } })).toBe(false);
  });
});

describe("getManageSections — mục của tab Quản lý", () => {
  it("OWNER/ADMIN nhóm PRIVATE: đủ 4 mục", () => {
    expect(getManageSections({ my_role: "OWNER", privacy: "PRIVATE" })).toEqual(["requests", "members", "banned", "settings"]);
    expect(getManageSections({ my_role: "ADMIN", privacy: "PRIVATE" })).toEqual(["requests", "members", "banned", "settings"]);
  });

  it("OWNER nhóm PUBLIC: không có mục Yêu cầu (vào thẳng, không có gì để duyệt)", () => {
    expect(getManageSections({ my_role: "OWNER", privacy: "PUBLIC" })).toEqual(["members", "banned", "settings"]);
  });

  it("MODERATOR: chỉ duyệt yêu cầu, và chỉ ở nhóm cần duyệt", () => {
    expect(getManageSections({ my_role: "MODERATOR", privacy: "PRIVATE" })).toEqual(["requests"]);
    expect(getManageSections({ my_role: "MODERATOR", privacy: "PUBLIC" })).toEqual([]);
  });

  it("MEMBER và người ngoài: không có tab Quản lý", () => {
    expect(getManageSections({ my_role: "MEMBER", privacy: "PRIVATE" })).toEqual([]);
    expect(getManageSections({ my_role: undefined, privacy: "PRIVATE" })).toEqual([]);
  });
});

describe("canManageMember / assignableRoles — ẩn hành động lên chính mình và lên OWNER", () => {
  const owner = { role: "OWNER", user_id: "u-owner" };
  const admin = { role: "ADMIN", user_id: "u-admin" };
  const mod = { role: "MODERATOR", user_id: "u-mod" };
  const member = { role: "MEMBER", user_id: "u-member" };

  it("không ai thao tác được lên OWNER", () => {
    expect(canManageMember("OWNER", owner, "u-other")).toBe(false);
    expect(canManageMember("ADMIN", owner, "u-admin")).toBe(false);
  });

  it("không thao tác lên chính mình", () => {
    expect(canManageMember("OWNER", { role: "OWNER", user_id: "me" }, "me")).toBe(false);
    expect(canManageMember("ADMIN", { role: "MEMBER", user_id: "me" }, "me")).toBe(false);
  });

  it("OWNER thao tác được lên ADMIN, MODERATOR, MEMBER", () => {
    for (const t of [admin, mod, member]) expect(canManageMember("OWNER", t, "u-owner")).toBe(true);
  });

  it("ADMIN chỉ thao tác lên MODERATOR/MEMBER, không lên ADMIN khác (UI không quảng bá nợ backend)", () => {
    expect(canManageMember("ADMIN", mod, "u-admin")).toBe(true);
    expect(canManageMember("ADMIN", member, "u-admin")).toBe(true);
    expect(canManageMember("ADMIN", admin, "u-x")).toBe(false);
  });

  it("MODERATOR / MEMBER không quản lý thành viên", () => {
    expect(canManageMember("MODERATOR", member, "u-mod")).toBe(false);
    expect(canManageMember("MEMBER", member, "u-x")).toBe(false);
  });

  it("thiếu id người xem thì từ chối (chưa biết đó có phải chính mình không)", () => {
    expect(canManageMember("OWNER", member, undefined)).toBe(false);
  });

  it("vai gán được: OWNER phong được ADMIN, ADMIN thì không; bỏ vai hiện tại", () => {
    expect(assignableRoles("OWNER", member, "u-owner")).toEqual(["ADMIN", "MODERATOR"]);
    expect(assignableRoles("OWNER", mod, "u-owner")).toEqual(["ADMIN", "MEMBER"]);
    expect(assignableRoles("ADMIN", member, "u-admin")).toEqual(["MODERATOR"]);
    expect(assignableRoles("ADMIN", mod, "u-admin")).toEqual(["MEMBER"]);
    expect(assignableRoles("ADMIN", owner, "u-admin")).toEqual([]);
  });
});
