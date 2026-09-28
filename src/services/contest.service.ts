/**
 * API công khai + học viên của "Cuộc thi" (contract §2.2 #1, #2, #7, #12–#17). Quản lý (giảng
 * viên/admin) nằm ở `contest-manage.service.ts` của lane W2.
 *
 * TẠI SAO không dùng thẳng `apiClient`: interceptor dùng chung (`lib/api-client.ts`) đổi 403/404
 * thành `ForbiddenError`/`NotFoundError` với code cứng "FORBIDDEN"/"NOT_FOUND", làm rơi mất
 * `code` nghiệp vụ (`CONTEST_COURSE_REQUIRED`, `CONTEST_RESULT_NOT_FOUND`...) mà màn hình cần để
 * nói đúng lý do. Ở đây tự nhận các status nghiệp vụ (400/403/404/409) bằng `validateStatus` rồi
 * ném `ContestApiError` giữ nguyên `code`. 401 (refresh token), 429, 5xx và mất mạng vẫn đi qua
 * interceptor như mọi request khác.
 */
import type { AxiosRequestConfig } from "axios";
import { api } from "@/lib/api-client";
import { ApiError } from "@/lib/errors";
import type {
  ContestCertificate,
  ContestDetail,
  ContestLeaderboardPage,
  ContestListParams,
  ContestMyResult,
  ContestMySummary,
  ContestPage,
  ContestStartResult,
  ContestSubmitRequest,
  ContestSubmitResult,
  ContestSummary,
  MyParticipation,
} from "@/types/contest";

/** Status nghiệp vụ backend trả `{message, code}` (§2.4) — service tự xử lý thay interceptor. */
const BUSINESS_ERROR_STATUSES = new Set([400, 403, 404, 409]);

interface ErrorBody {
  message?: string;
  code?: string;
  errors?: unknown[];
}

type Envelope<T> = { message: string; data: T };

export class ContestApiError extends ApiError {
  constructor(status: number, code: string, message: string) {
    super(status, code, message);
    this.name = "ContestApiError";
  }
}

/** Mã thay thế khi body lỗi không có `code` (lỗi validate, 404 route không tồn tại). */
function fallbackCode(status: number, body: ErrorBody | undefined): string {
  if (status === 400 && Array.isArray(body?.errors)) return "VALIDATION_FAILED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  return "UNKNOWN";
}

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api.request<Envelope<T> | ErrorBody>({
    ...config,
    validateStatus: (status) => (status >= 200 && status < 300) || BUSINESS_ERROR_STATUSES.has(status),
  });
  if (res.status >= 400) {
    const body = res.data as ErrorBody | undefined;
    throw new ContestApiError(res.status, body?.code ?? fallbackCode(res.status, body), body?.message ?? "");
  }
  return (res.data as Envelope<T>).data;
}

export const contestService = {
  /** #1 — công khai, không middleware. */
  list: (params?: ContestListParams) =>
    request<ContestPage<ContestSummary>>({ method: "GET", url: "/contests", params }),

  /** #2 — cuộc thi mình đã đăng ký. */
  listMine: (params?: { page?: number; limit?: number }) =>
    request<ContestPage<ContestMySummary>>({ method: "GET", url: "/contests/me", params }),

  /** #7 — OptionalAuth: khách không có cookie nhận `viewer` của khách. */
  getBySlug: (slug: string) =>
    request<ContestDetail>({ method: "GET", url: `/contests/${encodeURIComponent(slug)}` }),

  join: (contestId: string) =>
    request<MyParticipation>({ method: "POST", url: `/contests/${contestId}/join` }),

  /** Idempotent: đang làm dở thì backend trả lại ĐÚNG attempt cũ (§4.1). */
  start: (contestId: string) =>
    request<ContestStartResult>({ method: "POST", url: `/contests/${contestId}/start` }),

  submit: (contestId: string, body: ContestSubmitRequest) =>
    request<ContestSubmitResult>({ method: "POST", url: `/contests/${contestId}/submit`, data: body }),

  myResult: (contestId: string) =>
    request<ContestMyResult>({ method: "GET", url: `/contests/${contestId}/my-result` }),

  leaderboard: (contestId: string, params?: { page?: number; limit?: number }) =>
    request<ContestLeaderboardPage>({ method: "GET", url: `/contests/${contestId}/leaderboard`, params }),

  certificate: (contestId: string) =>
    request<ContestCertificate>({ method: "GET", url: `/contests/${contestId}/certificate` }),
};

// LEGACY — trang giảng viên cũ (lane W2) còn import các type này từ đây; xoá khi W2 merge.
export type { Contest, CreateContestDTO, CreateProblemDTO } from "./contest-legacy.service";
