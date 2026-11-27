import { describe, expect, it } from "vitest";
import { getUserStatusLabel, getUserStatusVariant, isSelfDeleted } from "./user-status-label";

describe("user-status-label — Q10-ADMIN-03", () => {
  it("đang hoạt động", () => {
    const u = { is_active: true, self_deleted_at: null };
    expect(getUserStatusLabel(u)).toBe("Đang hoạt động");
    expect(getUserStatusVariant(u)).toBe("success");
  });

  it("bị admin khoá (không có mốc tự xoá) => Đã khoá", () => {
    const u = { is_active: false, self_deleted_at: null };
    expect(isSelfDeleted(u)).toBe(false);
    expect(getUserStatusLabel(u)).toBe("Đã khoá");
    expect(getUserStatusVariant(u)).toBe("destructive");
  });

  it("người dùng tự xoá => Đã tự xoá, màu trung tính", () => {
    const u = { is_active: false, self_deleted_at: "2026-11-27T08:00:00Z" };
    expect(isSelfDeleted(u)).toBe(true);
    expect(getUserStatusLabel(u)).toBe("Đã tự xoá");
    expect(getUserStatusVariant(u)).toBe("secondary");
  });

  it("backend cũ chưa gửi trường (undefined) => coi là bị khoá", () => {
    expect(getUserStatusLabel({ is_active: false })).toBe("Đã khoá");
  });

  it("tài khoản đang hoạt động không bao giờ là tự xoá, kể cả khi còn mốc cũ", () => {
    expect(isSelfDeleted({ is_active: true, self_deleted_at: "2026-11-27T08:00:00Z" })).toBe(false);
  });
});
