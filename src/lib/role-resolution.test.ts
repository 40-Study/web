/**
 * Q3-05: vai tuỳ biến của tổ chức (QA3_TEACHER) không có khu vực riêng -> trước đây rơi về /home rồi bị đá sang /403.
 * Q3-14: người đã là giảng viên không được mời "Đăng ký làm giảng viên".
 */

import { describe, expect, it } from "vitest";
import {
  filterAddableSystemRoles,
  isAppRole,
  isSelectableRole,
  mapOrgRoleToSystemRole,
  resolveHomeRoute,
  type RoleLike,
} from "./role-resolution";

const sys = (role_name: string): RoleLike => ({ type: "system", role_name });
const org = (role_name: string): RoleLike => ({ type: "organization", role_name });

describe("isSelectableRole / isAppRole", () => {
  it("vai hệ thống và ORG_OWNER có khu vực -> chọn được", () => {
    for (const name of ["STUDENT", "TEACHER", "PARENT", "SYSTEM_ADMIN", "TEACHER_APPLICANT"]) {
      expect(isSelectableRole(sys(name))).toBe(true);
    }
    expect(isSelectableRole(org("ORG_OWNER"))).toBe(true);
  });

  it("vai tuỳ biến của tổ chức (QA3_TEACHER) không được đưa ra như một đích riêng", () => {
    expect(isSelectableRole(org("QA3_TEACHER"))).toBe(false);
    expect(isSelectableRole(org("ACCOUNTANT"))).toBe(false);
    expect(isAppRole("QA3_TEACHER")).toBe(false);
  });

  it("chuẩn hoá hoa/thường và bí danh ADMIN", () => {
    expect(isAppRole(" teacher ")).toBe(true);
    expect(isAppRole("admin")).toBe(true);
    expect(isAppRole(null)).toBe(false);
  });
});

describe("mapOrgRoleToSystemRole", () => {
  it("vai web nhận biết giữ nguyên", () => {
    expect(mapOrgRoleToSystemRole("ORG_OWNER", [])).toBe("ORG_OWNER");
    expect(mapOrgRoleToSystemRole("student", [])).toBe("STUDENT");
  });

  it("QA3_TEACHER + vai hệ thống TEACHER -> TEACHER", () => {
    expect(mapOrgRoleToSystemRole("QA3_TEACHER", [sys("TEACHER"), org("QA3_TEACHER")])).toBe("TEACHER");
  });

  it("nhiều vai hệ thống: giảng viên thắng học viên; quản trị hệ thống xếp cuối", () => {
    expect(mapOrgRoleToSystemRole("X", [sys("STUDENT"), sys("TEACHER")])).toBe("TEACHER");
    expect(mapOrgRoleToSystemRole("X", [sys("SYSTEM_ADMIN"), sys("PARENT")])).toBe("PARENT");
    expect(mapOrgRoleToSystemRole("X", [sys("SYSTEM_ADMIN")])).toBe("SYSTEM_ADMIN");
  });

  it("chỉ có vai tuỳ biến, không có vai hệ thống -> null (không bịa)", () => {
    expect(mapOrgRoleToSystemRole("QA3_TEACHER", [org("QA3_TEACHER")])).toBeNull();
    expect(mapOrgRoleToSystemRole(null, [sys("TEACHER")])).toBeNull();
  });

  it("vai tổ chức trùng mã hệ thống (ORG_OWNER) không bị coi là vai hệ thống để quy đổi", () => {
    expect(mapOrgRoleToSystemRole("QA3_TEACHER", [org("TEACHER")])).toBeNull();
  });
});

describe("resolveHomeRoute", () => {
  it("QA3_TEACHER có vai hệ thống TEACHER -> khu giảng viên, không phải /home hay /403", () => {
    const route = resolveHomeRoute("QA3_TEACHER", [sys("TEACHER"), org("QA3_TEACHER")]);
    expect(route).toBe("/teacher/schedule");
  });

  it("ORG_OWNER vẫn về /org", () => {
    expect(resolveHomeRoute("ORG_OWNER", [org("ORG_OWNER")])).toBe("/org");
  });

  it("mã lạ không bao giờ ra /403: không quy được thì về màn chọn vai trò", () => {
    for (const roles of [[], [org("QA3_TEACHER")], [sys("TEACHER")]]) {
      expect(resolveHomeRoute("QA3_TEACHER", roles)).not.toBe("/403");
    }
    expect(resolveHomeRoute("QA3_TEACHER", [])).toBe("/login/role");
    expect(resolveHomeRoute(null, [])).toBe("/login/role");
  });

  it("fallback tuỳ chọn", () => {
    expect(resolveHomeRoute("ZZZ", [], "/")).toBe("/");
  });
});

describe("filterAddableSystemRoles (Q3-14)", () => {
  const options = [
    { id: "1", name: "STUDENT" },
    { id: "2", name: "TEACHER" },
    { id: "3", name: "PARENT" },
    { id: "4", name: "TEACHER_APPLICANT" },
  ];

  it("đã là TEACHER: ẩn TEACHER_APPLICANT và các vai đã có", () => {
    const names = filterAddableSystemRoles(options, [sys("TEACHER"), sys("STUDENT")]).map((o) => o.name);
    expect(names).toEqual(["PARENT"]);
  });

  it("chưa là giảng viên: vẫn mời đăng ký làm giảng viên", () => {
    const names = filterAddableSystemRoles(options, [sys("STUDENT")]).map((o) => o.name);
    expect(names).toContain("TEACHER_APPLICANT");
    expect(names).toContain("TEACHER");
  });

  it("so khớp không phân biệt hoa thường", () => {
    const names = filterAddableSystemRoles(options, [sys("teacher")]).map((o) => o.name);
    expect(names).not.toContain("TEACHER_APPLICANT");
    expect(names).not.toContain("TEACHER");
  });
});
