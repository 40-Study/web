import { refreshSession } from "@/lib/api-client";
import { DEFAULT_API_BASE_URL } from "@/lib/default-backend-url";

const API_URL = typeof window !== "undefined" ? "/api" : process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;

/**
 * Lỗi HTTP của client "meet" (phòng live). Backend Fiber trả `{message, error}`
 * ở mọi lỗi, nhưng ý nghĩa của `message` khác nhau theo route:
 * - Đa số route: `message` là text đọc được, `error` là chi tiết kỹ thuật.
 * - Riêng 403 uy quyền của nhóm livestream/chat/whiteboard (issue #58 review
 *   vòng 2, §7.4): `message` là MÃ CỐ ĐỊNH (`NOT_SESSION_MEMBER`,
 *   `WHITEBOARD_LOCKED`, `KICKED`, `NOT_SESSION_HOST`, `CANNOT_KICK_HOST`) để
 *   phân biệt lý do; `error` là chuỗi Go gốc, không nên hiển thị thẳng.
 *
 * `.message` (property Error chuẩn) GIỮ NGUYÊN hành vi cũ — ưu tiên
 * `error.error` — để không đổi UX ở những nơi đã hiển thị `err.message` thẳng
 * cho người dùng (assignment/submission). Nơi cần phân biệt theo mã 403 đọc
 * `.code` (chỉ có ý nghĩa khi `.status === 403`).
 */
export class MeetApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    /** Trường `code` của body (vd. CLASS_ARCHIVED); khác `.code` ở trên vốn là `message` của envelope 403. */
    public bodyCode?: string
  ) {
    super(message);
    this.name = 'MeetApiError';
  }
}

async function authenticatedFetch(path: string, options: RequestInit): Promise<Response> {
  const send = () => fetch(`${API_URL}${path}`, { ...options, credentials: "include" });
  let response = await send();
  if (response.status === 401) {
    try {
      await refreshSession();
      response = await send();
    } catch { /* Keep the original unauthorized response for the classroom error boundary. */ }
  }
  return response;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await authenticatedFetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new MeetApiError(res.status, body.error ?? `HTTP ${res.status}`, body.message, body.code);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  // Upload files (FormData) - no Content-Type header to let browser set multipart boundary
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const res = await authenticatedFetch(path, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new MeetApiError(res.status, body.error ?? `HTTP ${res.status}`, body.message, body.code);
    }
    return res.json();
  },
};
