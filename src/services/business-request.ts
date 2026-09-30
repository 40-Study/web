/**
 * Gọi API nghiệp vụ mà màn hình cần ĐỌC `code` của lỗi 400/403/404/409/429.
 *
 * TẠI SAO không dùng thẳng `api.get/post`: interceptor dùng chung (`lib/api-client.ts`) đổi 403/404/429
 * thành `ForbiddenError`/`NotFoundError`/`RateLimitError` với code cứng, làm rơi mất `code` nghiệp vụ
 * (`FRIEND_REQUEST_NOT_ALLOWED`, `FRIEND_DAILY_LIMIT_REACHED`...) — mà bảng `error-messages.ts` cần để nói
 * đúng lý do. Ở đây tự nhận các status nghiệp vụ bằng `validateStatus` rồi ném `BusinessApiError` giữ
 * nguyên `code` và `data` của body lỗi. 401 (refresh token), 5xx và mất mạng vẫn đi qua interceptor.
 * Cùng ý tưởng với `contest.service.ts`.
 *
 * 429 KHÔNG có `code` (limiter chung của middleware) vẫn thành `RateLimitError` như mọi request khác.
 */
import type { AxiosRequestConfig } from "axios";
import { api } from "@/lib/api-client";
import { ApiError, RateLimitError } from "@/lib/errors";

const BUSINESS_ERROR_STATUSES = new Set([400, 403, 404, 409, 429]);

interface ErrorBody {
  message?: string;
  code?: string;
  /** Dữ liệu đi kèm lỗi, vd. `InviteMembersResult` của 403 GROUP_INVITE_NOT_ALLOWED (contract §2). */
  data?: unknown;
  retry_after?: number;
}

type Envelope<T> = { message: string; data: T };

export class BusinessApiError extends ApiError {
  /** `data` thô của body lỗi; nơi dùng tự kiểm shape trước khi đọc. */
  public readonly payload?: unknown;

  constructor(status: number, code: string, message: string, payload?: unknown) {
    super(status, code, message);
    this.name = "BusinessApiError";
    this.payload = payload;
  }
}

function retryAfterSeconds(body: ErrorBody | undefined, headers: Record<string, unknown> | undefined) {
  const fromBody = Number(body?.retry_after);
  if (Number.isFinite(fromBody) && fromBody > 0) return Math.ceil(fromBody);
  const fromHeader = Number(headers?.["retry-after"]);
  if (Number.isFinite(fromHeader) && fromHeader > 0) return Math.ceil(fromHeader);
  return undefined;
}

export async function businessRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api.request<Envelope<T> | ErrorBody>({
    ...config,
    validateStatus: (status) => (status >= 200 && status < 300) || BUSINESS_ERROR_STATUSES.has(status),
  });

  if (res.status >= 400) {
    const body = res.data as ErrorBody | undefined;
    if (res.status === 429 && !body?.code) {
      throw new RateLimitError(retryAfterSeconds(body, res.headers as Record<string, unknown> | undefined));
    }
    throw new BusinessApiError(res.status, body?.code ?? "UNKNOWN", body?.message ?? "", body?.data);
  }
  return (res.data as Envelope<T>).data;
}
