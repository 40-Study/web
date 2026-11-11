import { create } from "zustand";
import { BOOTSTRAP_RETRY_DELAYS_MS } from "./session-failure-policy";

/**
 * Trạng thái kết nối của lần khôi phục phiên (không persist). Tách khỏi auth.store vì nó không nói
 * gì về phiên: phiên vẫn ở `checking` và `user` cache được giữ; đây chỉ là thông tin để báo trung
 * thực cho người dùng rằng máy chủ chưa trả lời (QA-B-01 / QA-C-02).
 *
 * - `ok`: không có sự cố (hoặc đã khôi phục được).
 * - `retrying`: lần gọi vừa rồi lỗi mạng/timeout/5xx, đang chờ để thử lại lần `attempt`.
 * - `offline`: đã hết lượt thử lại tự động, chờ người dùng bấm "Thử lại" hoặc mạng có lại.
 *
 * `canRetryNow`: đang trong một lượt chờ dài (429 có thể tới khoảng 61s mỗi lượt), banner hiện nút
 * "Thử lại ngay" để người dùng không kẹt. Lượt chờ ngắn không hiện, nút chỉ loé lên rồi mất.
 */
export type SessionConnectionState = "ok" | "retrying" | "offline";

const LONG_WAIT_MS = 10_000;

interface SessionConnectionStore {
  state: SessionConnectionState;
  attempt: number;
  maxAttempts: number;
  canRetryNow: boolean;
  /** `waitMs` = thời gian sắp chờ trước lần thử kế tiếp; bỏ trống khi request đang chạy. */
  markRetrying: (attempt: number, waitMs?: number) => void;
  markOffline: () => void;
  markOk: () => void;
}

export const useSessionConnectionStore = create<SessionConnectionStore>()((set) => ({
  state: "ok",
  attempt: 0,
  maxAttempts: BOOTSTRAP_RETRY_DELAYS_MS.length,
  canRetryNow: false,
  markRetrying: (attempt, waitMs = 0) => set({ state: "retrying", attempt, canRetryNow: waitMs >= LONG_WAIT_MS }),
  markOffline: () => set({ state: "offline", canRetryNow: false }),
  markOk: () => set({ state: "ok", attempt: 0, canRetryNow: false }),
}));
