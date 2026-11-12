/**
 * Ý định "thêm khoá vào giỏ" của khách, giữ qua bước đăng nhập (UX-A-03, chủ dự án chốt 12/11:
 * không làm giỏ tạm). Khách bấm "Thêm vào giỏ" -> lưu khoá nào ở đây rồi sang /login?redirect=<trang
 * khoá>; đăng nhập xong quay lại trang khoá, trang khoá thấy ý định khớp thì tự thêm.
 *
 * TẠI SAO sessionStorage mà không phải tham số URL (`?action=add-to-cart`): URL chia sẻ được, ai đó
 * gửi link là người đã đăng nhập bị thêm khoá vào giỏ ngoài ý muốn. sessionStorage chỉ sống trong
 * đúng tab đã bấm, nên chỉ chính người bấm mới kích hoạt được. Có hạn dùng để ý định cũ (bỏ dở đăng
 * nhập, quay lại hôm sau) không tự chạy bất ngờ.
 */

const STORAGE_KEY = "fortex-pending-cart-intent";
export const PENDING_CART_INTENT_TTL_MS = 30 * 60 * 1000;

export interface PendingCartIntent {
  courseId: string;
  slug: string;
  createdAt: number;
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    // Trình duyệt chặn storage (chế độ riêng tư cứng): không giữ được ý định, khách bấm lại sau.
    return null;
  }
}

export function savePendingCartIntent(courseId: string, slug: string, now = Date.now()): void {
  const intent: PendingCartIntent = { courseId, slug, createdAt: now };
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(intent));
  } catch {
    // Hết quota hoặc bị chặn: bỏ qua, chỉ mất bước tự thêm.
  }
}

export function clearPendingCartIntent(): void {
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // Bỏ qua như savePendingCartIntent.
  }
}

/** Ý định còn hạn, đúng định dạng; hỏng hoặc quá hạn thì xoá và trả null. */
export function readPendingCartIntent(now = Date.now()): PendingCartIntent | null {
  let raw: string | null = null;
  try {
    raw = storage()?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearPendingCartIntent();
    return null;
  }
  const intent = parsed as Partial<PendingCartIntent> | null;
  const isValid =
    !!intent &&
    typeof intent.courseId === "string" &&
    intent.courseId !== "" &&
    typeof intent.slug === "string" &&
    typeof intent.createdAt === "number" &&
    now - intent.createdAt >= 0 &&
    now - intent.createdAt <= PENDING_CART_INTENT_TTL_MS;
  if (!isValid) {
    clearPendingCartIntent();
    return null;
  }
  return intent as PendingCartIntent;
}

/** Trang đăng nhập có đang được mở để hoàn tất ý định thêm giỏ không (redirect trỏ đúng trang khoá). */
export function isLoginForPendingCartIntent(redirect: string | null, now = Date.now()): boolean {
  const intent = readPendingCartIntent(now);
  return !!intent && !!redirect && redirect === `/courses/${intent.slug}`;
}
