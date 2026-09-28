/**
 * LEGACY — chỉ để 2 trang giảng viên cũ (`app/(teacher)/teacher/contests/**`, thuộc lane W2) còn
 * biên dịch được trong lúc W1 và W2 chạy song song. Các endpoint `/publish`, `/problems` ở đây
 * backend MVP đã GỠ (contract §2.2), nên gọi sẽ 404. W2 thay 2 trang đó bằng
 * `contest-manage.service.ts`; sau khi W2 merge, xoá file này và `use-contests-legacy.ts`.
 * KHÔNG dùng cho màn hình mới.
 */
import { api } from "@/lib/api-client";

export type LegacyContestType = "CODING" | "QUIZ" | "MIXED";
export type LegacyProblemType = "CODE" | "MULTIPLE_CHOICE" | "SHORT_ANSWER";

export interface Contest {
  id: string;
  title: string;
  slug: string;
  description?: string;
  type: LegacyContestType;
  status: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  participant_count: number;
  is_public: boolean;
  created_at: string;
}

export interface CreateContestDTO {
  title: string;
  description?: string;
  type: LegacyContestType;
  start_time: string;
  end_time: string;
  duration?: number;
  max_participants?: number;
  is_public?: boolean;
}

export interface CreateProblemDTO {
  title: string;
  description: string;
  type: LegacyProblemType;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  time_limit?: number;
  memory_limit?: number;
  input_format?: string;
  output_format?: string;
  sample_input?: string;
  sample_output?: string;
  test_cases?: unknown;
  options?: Record<string, string>;
  correct_answer?: string;
}

type R<T> = { message: string; data: T };

export const legacyContestService = {
  list: (params?: { page?: number; limit?: number }) =>
    api
      .get<R<{ contests?: Contest[]; items?: Contest[]; total_count: number }>>("/contests", { params })
      .then((r) => ({ contests: r.data.data.contests ?? r.data.data.items ?? [], total_count: r.data.data.total_count })),
  create: (data: CreateContestDTO) => api.post<R<Contest>>("/contests", data).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/contests/${id}`).then((r) => r.data),
  publish: (id: string) => api.post<R<Contest>>(`/contests/${id}/publish`).then((r) => r.data.data),
  createProblem: (contestId: string, data: CreateProblemDTO) =>
    api.post<R<unknown>>(`/contests/${contestId}/problems`, data).then((r) => r.data.data),
};
