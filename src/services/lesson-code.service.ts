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
const path = (lessonID: string, exerciseID: string) =>
  `/lessons/${lessonID}/exercises/${exerciseID}`;
export const lessonCodeService = {
  get: (lessonID: string, exerciseID: string) =>
    api.get<{ data: LessonCodeDetail }>(path(lessonID, exerciseID)).then((r) => r.data.data),
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
