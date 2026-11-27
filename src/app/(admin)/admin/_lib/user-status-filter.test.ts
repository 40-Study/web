import { describe, expect, it } from "vitest";
import { isSplitClientSide, matchesStatusFilter, parseStatusFilter, toApiStatus } from "./user-status-filter";

const ACTIVE = { is_active: true, self_deleted_at: null };
const LOCKED = { is_active: false, self_deleted_at: null };
const DELETED = { is_active: false, self_deleted_at: "2026-11-27T08:00:00Z" };
const OLD_BACKEND = { is_active: false };

describe("user-status-filter (Q10 #147 L1)", () => {
  it("'Đã khoá' loại tài khoản tự xoá; backend cũ (không có trường) vẫn là bị khoá", () => {
    expect(matchesStatusFilter(LOCKED, "locked")).toBe(true);
    expect(matchesStatusFilter(OLD_BACKEND as never, "locked")).toBe(true);
    expect(matchesStatusFilter(DELETED, "locked")).toBe(false);
  });

  it("'Đã tự xoá' chỉ giữ tài khoản tự xoá", () => {
    expect(matchesStatusFilter(DELETED, "self-deleted")).toBe(true);
    expect(matchesStatusFilter(LOCKED, "self-deleted")).toBe(false);
    expect(matchesStatusFilter(OLD_BACKEND as never, "self-deleted")).toBe(false);
  });

  it("'Tất cả' và 'Đang hoạt động' không lọc thêm phía client", () => {
    for (const user of [ACTIVE, LOCKED, DELETED]) {
      expect(matchesStatusFilter(user, "ALL")).toBe(true);
      expect(matchesStatusFilter(user, "active")).toBe(true);
    }
  });

  it("API chỉ biết active|locked: 'self-deleted' gửi lên là locked", () => {
    expect(toApiStatus("ALL")).toBeUndefined();
    expect(toApiStatus("active")).toBe("active");
    expect(toApiStatus("locked")).toBe("locked");
    expect(toApiStatus("self-deleted")).toBe("locked");
  });

  it("parse URL: giá trị lạ về ALL; chỉ locked/self-deleted là tách phía client", () => {
    expect(parseStatusFilter("self-deleted")).toBe("self-deleted");
    expect(parseStatusFilter("nope")).toBe("ALL");
    expect(parseStatusFilter(null)).toBe("ALL");
    expect(isSplitClientSide("locked")).toBe(true);
    expect(isSplitClientSide("self-deleted")).toBe(true);
    expect(isSplitClientSide("active")).toBe(false);
  });
});
