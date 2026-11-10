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
 */
export type SessionConnectionState = "ok" | "retrying" | "offline";

interface SessionConnectionStore {
  state: SessionConnectionState;
  attempt: number;
  maxAttempts: number;
  markRetrying: (attempt: number) => void;
  markOffline: () => void;
  markOk: () => void;
}

export const useSessionConnectionStore = create<SessionConnectionStore>()((set) => ({
  state: "ok",
  attempt: 0,
  maxAttempts: BOOTSTRAP_RETRY_DELAYS_MS.length,
  markRetrying: (attempt) => set({ state: "retrying", attempt }),
  markOffline: () => set({ state: "offline" }),
  markOk: () => set({ state: "ok", attempt: 0 }),
}));
