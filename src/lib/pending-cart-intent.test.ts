import { beforeEach, describe, expect, it } from "vitest";
import {
  PENDING_CART_INTENT_TTL_MS,
  clearPendingCartIntent,
  isLoginForPendingCartIntent,
  readPendingCartIntent,
  savePendingCartIntent,
} from "./pending-cart-intent";

// UX-A-03: ý định thêm giỏ của khách giữ qua bước đăng nhập, chỉ trong tab đã bấm và có hạn dùng.
describe("pending-cart-intent", () => {
  const now = 1_700_000_000_000;

  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("lưu rồi đọc lại đúng khoá", () => {
    savePendingCartIntent("course-1", "python-co-ban", now);
    expect(readPendingCartIntent(now + 1000)).toEqual({ courseId: "course-1", slug: "python-co-ban", createdAt: now });
  });

  it("quá hạn -> null và xoá luôn", () => {
    savePendingCartIntent("course-1", "python-co-ban", now);
    expect(readPendingCartIntent(now + PENDING_CART_INTENT_TTL_MS + 1)).toBeNull();
    expect(readPendingCartIntent(now)).toBeNull();
  });

  it("dữ liệu hỏng (JSON sai, thiếu field) -> null, không ném lỗi", () => {
    window.sessionStorage.setItem("fortex-pending-cart-intent", "{oops");
    expect(readPendingCartIntent(now)).toBeNull();
    window.sessionStorage.setItem("fortex-pending-cart-intent", JSON.stringify({ slug: "x", createdAt: now }));
    expect(readPendingCartIntent(now)).toBeNull();
  });

  it("clear -> không còn ý định", () => {
    savePendingCartIntent("course-1", "python-co-ban", now);
    clearPendingCartIntent();
    expect(readPendingCartIntent(now)).toBeNull();
  });

  it("trang login chỉ nhận là 'để thêm giỏ' khi redirect trỏ đúng trang khoá đó", () => {
    savePendingCartIntent("course-1", "python-co-ban", now);
    expect(isLoginForPendingCartIntent("/courses/python-co-ban", now)).toBe(true);
    expect(isLoginForPendingCartIntent("/courses/khoa-khac", now)).toBe(false);
    expect(isLoginForPendingCartIntent(null, now)).toBe(false);
  });
});
