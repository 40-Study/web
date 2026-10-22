import { ApiError } from "@/lib/errors";
import { api } from "@/lib/api-client";
import type { Exercise, TestCase } from "./exercise.service";
import type { ContestCodeResult } from "@/types/contest";
export interface LessonCodeDetail {
  exercise: Exercise & { test_cases: TestCase[] };
  last_submission?: ContestCodeResult;
}
export interface LessonCodeInput {
  request_id: string;
  code: string;
  language: string;
  stdin: string;
}
/** Một bài nộp trong lịch sử, cùng cách đặt tên verdict/điểm với kết quả chấm (ContestCodeResult). */
export interface LessonCodeHistoryItem {
  id: string;
  language: string;
  code: string;
  status: string;
  passed: number;
  total: number;
  score: number;
  execution_time_ms?: number;
  created_at: string;
}
/** Dòng của `GET /exercises/:id/my-submissions` (backend dto.ExerciseSubmissionResponseDTO). */
interface MySubmissionRow {
  id: string;
  language: string;
  code: string;
  verdict: string;
  test_cases_passed: number;
  total_test_cases: number;
  execution_time_ms?: number;
  created_at: string;
}
export const LESSON_CODE_HISTORY_PAGE_SIZE = 20;
const path = (lessonID: string, exerciseID: string) =>
  `/lessons/${lessonID}/exercises/${exerciseID}`;
// Backend lưu verdict chữ thường và không lưu điểm; điểm tính như lesson_code_service.go (100*passed/total).
const toHistoryItem = (row: MySubmissionRow): LessonCodeHistoryItem => ({
  id: row.id,
  language: row.language,
  code: row.code,
  status: row.verdict.toUpperCase(),
  passed: row.test_cases_passed,
  total: row.total_test_cases,
  score:
    row.total_test_cases > 0 ? Math.floor((100 * row.test_cases_passed) / row.total_test_cases) : 0,
  execution_time_ms: row.execution_time_ms,
  created_at: row.created_at,
});
export const lessonCodeService = {
  get: (lessonID: string, exerciseID: string) =>
    api.get<{ data: LessonCodeDetail }>(path(lessonID, exerciseID)).then((r) => r.data.data),
  /** Lịch sử nộp bài của chính người học, mới nhất trước (trang đầu); `total` là tổng số bài nộp. */
  history: (exerciseID: string) =>
    api
      .get<{
        data: { data: MySubmissionRow[] | null; total: number };
      }>(`/exercises/${exerciseID}/my-submissions`, {
        params: { page: 1, page_size: LESSON_CODE_HISTORY_PAGE_SIZE },
      })
      .then((r) => {
        const items = (r.data.data?.data ?? []).map(toHistoryItem);
        return { items, total: Math.max(r.data.data?.total ?? 0, items.length) };
      }),
  judge: (lessonID: string, exerciseID: string, input: LessonCodeInput, submit: boolean) =>
    api
      .post<{
        data: ContestCodeResult;
      }>(`${path(lessonID, exerciseID)}/${submit ? "submit" : "run"}`, input, { timeout: 70_000 })
      .then((r) => r.data.data)
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status >= 500)
          throw new Error(
            "Máy chấm Judge0 đang không sẵn sàng. Mã nguồn và kết quả trước vẫn được giữ; hãy thử nộp lại."
          );
        throw error;
      }),
};
