import { describe, expect, it } from "vitest";
import type { AdminUserListItem } from "@/types/user";
import { nextSort, sortAdminUsers } from "./user-sort";

function user(id: string, over: Partial<AdminUserListItem>): AdminUserListItem {
  return {
    id, email: `${id}@x.vn`, user_name: id, full_name: null, avatar_url: null, is_active: true, is_verified: true,
    locked_reason: null, locked_at: null, last_login_at: null, created_at: "2026-01-01T00:00:00Z", system_roles: [], ...over,
  };
}

describe("sortAdminUsers", () => {
  const a = user("a", { created_at: "2026-03-01T00:00:00Z", last_login_at: "2026-10-01T00:00:00Z" });
  const b = user("b", { created_at: "2026-01-01T00:00:00Z", last_login_at: null });
  const c = user("c", { created_at: "2026-02-01T00:00:00Z", last_login_at: "2026-09-01T00:00:00Z" });

  it("không chọn cột thì giữ nguyên thứ tự", () => {
    expect(sortAdminUsers([a, b, c], null, "asc").map((u) => u.id)).toEqual(["a", "b", "c"]);
  });
  it("Ngày tạo giảm/tăng dần, không đổi mảng gốc", () => {
    const input = [a, b, c];
    expect(sortAdminUsers(input, "created_at", "desc").map((u) => u.id)).toEqual(["a", "c", "b"]);
    expect(sortAdminUsers(input, "created_at", "asc").map((u) => u.id)).toEqual(["b", "c", "a"]);
    expect(input.map((u) => u.id)).toEqual(["a", "b", "c"]);
  });
  it("chưa từng đăng nhập luôn xuống cuối cả hai chiều", () => {
    expect(sortAdminUsers([a, b, c], "last_login_at", "desc").map((u) => u.id)).toEqual(["a", "c", "b"]);
    expect(sortAdminUsers([a, b, c], "last_login_at", "asc").map((u) => u.id)).toEqual(["c", "a", "b"]);
  });
  it("Tên: theo họ tên, rơi về tên đăng nhập, không phân biệt hoa thường", () => {
    const x = user("x", { full_name: "Bình" });
    const y = user("y", { full_name: "an" });
    const z = user("z", { user_name: "Cường" });
    expect(sortAdminUsers([x, y, z], "name", "asc").map((u) => u.id)).toEqual(["y", "x", "z"]);
  });
});

describe("nextSort", () => {
  it("cột ngày: giảm -> tăng -> bỏ", () => {
    let s = nextSort({ key: null, direction: "asc" }, "created_at");
    expect(s).toEqual({ key: "created_at", direction: "desc" });
    s = nextSort(s, "created_at");
    expect(s).toEqual({ key: "created_at", direction: "asc" });
    expect(nextSort(s, "created_at").key).toBeNull();
  });
  it("cột chữ bắt đầu ở tăng dần; đổi cột thì khởi động lại", () => {
    const s = nextSort({ key: "created_at", direction: "asc" }, "email");
    expect(s).toEqual({ key: "email", direction: "asc" });
  });
});
