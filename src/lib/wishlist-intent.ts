/**
 * Ý định "lưu yêu thích" của khách (review QA2 #7): khách bấm tim -> sang đăng nhập -> quay lại; tim đó phải được lưu
 * nốt thay vì bắt bấm lại. Lưu theo tab (sessionStorage) kèm thời điểm: ý định quá {@link INTENT_TTL_MS} bị bỏ để một
 * lần bấm cũ không tự lưu khoá vào ngày khác.
 */

const STORAGE_KEY = "fortex:wishlist-intent";
const INTENT_TTL_MS = 10 * 60 * 1000;

export function rememberWishlistIntent(courseId: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ courseId, at: Date.now() }));
  } catch {
    // Storage bị chặn (chế độ riêng tư): mất tiện ích "lưu nốt sau đăng nhập", không ảnh hưởng đăng nhập.
  }
}

/** Lấy và XOÁ ý định nếu nó thuộc `courseId` và còn hạn; không khớp thì để nguyên cho nút của khoá đó. */
export function consumeWishlistIntent(courseId: string): boolean {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const intent = JSON.parse(raw) as { courseId?: string; at?: number };
    if (typeof intent.at !== "number" || Date.now() - intent.at > INTENT_TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return false;
    }
    if (intent.courseId !== courseId) return false;
    window.sessionStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
