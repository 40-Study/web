/** Round 2 (web#128 follow-up): link tới route chỉ-học-viên phải đổi theo vai đang dùng, kể cả vai tuỳ biến của tổ chức. */
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import { useRoleAwareHref } from "./use-role-aware-href";

afterEach(() => useAuthStore.setState({ activeRole: null, roles: [] }));

const href = (activeRole: string | null, roles: { type: "system" | "organization"; role_name: string }[] = []) => {
  useAuthStore.setState({ activeRole, roles: roles as never });
  return renderHook(() => useRoleAwareHref()).result.current;
};

describe("useRoleAwareHref", () => {
  it("giảng viên: /my-courses và /schedule -> trang giảng viên", () => {
    const h = href("TEACHER");
    expect(h("/my-courses")).toBe("/teacher/courses");
    expect(h("/schedule")).toBe("/teacher/schedule");
  });

  it("học viên và khách giữ nguyên", () => {
    expect(href("STUDENT")("/my-courses")).toBe("/my-courses");
    expect(href(null)("/schedule")).toBe("/schedule");
  });

  it("vai tuỳ biến của tổ chức được quy về vai hệ thống trước khi đổi link", () => {
    const h = href("QA3_TEACHER", [
      { type: "system", role_name: "TEACHER" },
      { type: "organization", role_name: "QA3_TEACHER" },
    ]);
    expect(h("/my-courses")).toBe("/teacher/courses");
  });

  it("route không thuộc nhóm học viên-only giữ nguyên với giảng viên", () => {
    expect(href("TEACHER")("/orders")).toBe("/orders");
  });
});
