import { serverApi, HttpError } from "@/lib/server-api";

export interface JoinLivestreamResult {
  token?: string;
  server_url?: string;
  room_name?: string;
}

export interface CurrentUser {
  id: string;
  full_name?: string;
  username: string;
}

export interface JoinAttempt {
  result: JoinLivestreamResult | null;
  /**
   * Mã lỗi 403 uy quyền (issue #58 review vòng 2, §7.4) — `NOT_SESSION_MEMBER`,
   * `KICKED`, `NOT_SESSION_HOST`, v.v. Chỉ có giá trị khi backend trả 403; các
   * lỗi khác (401 chưa đăng nhập, phiên chưa live) không có mã này.
   */
  forbiddenCode?: string;
}

/**
 * Tách khỏi `page.tsx` (review vòng 2 web PR #18, I4) để test được trực tiếp
 * mà không phải import cả Server Component (kéo theo `RoomClient.tsx` — client
 * component nặng dùng LiveKit).
 */
export async function joinLivestream(sessionId: string): Promise<JoinAttempt> {
  try {
    const me = await serverApi.get<CurrentUser>("/auth/me");
    // Không gửi user_id trong body — backend lấy danh tính từ access token
    // (issue #58 review vòng 2, §7.1). Gửi user_id ở đây cho phép mạo danh
    // người khác khi tham gia phiên live.
    const result = await serverApi.post<JoinLivestreamResult>(`/livestream/${sessionId}/join`, {
      name: me.full_name || me.username,
    });
    return { result };
  } catch (err) {
    if (err instanceof HttpError && err.status === 403) {
      return { result: null, forbiddenCode: err.body?.message };
    }
    return { result: null };
  }
}
