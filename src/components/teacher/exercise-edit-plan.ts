/**
 * Phần thay đổi của một bài thực hành code ĐÃ TẠO (bộ test + giới hạn chấm), tính từ dữ liệu đã lưu và
 * form sửa. Tách khỏi component để kiểm thử thuần và để hộp thoại sửa nội dung áp dụng sau khi bấm lưu.
 */

import {
  exerciseService,
  type CreateTestCaseDTO,
  type Exercise,
  type TestCase,
  type UpdateExerciseDTO,
} from "@/services/exercise.service";
import type { ExerciseTestCaseDraft } from "./exercise-test-case-editor";
import type { ExerciseLimitsDraft, ExerciseLimitsPayload } from "./exercise-limits-fields";

export interface ExerciseEditPlan {
  /** Chỉ chứa giới hạn ĐÃ ĐỔI; `null` = không gửi `PUT /exercises/:id`. */
  exerciseUpdate: UpdateExerciseDTO | null;
  /** Test đã lưu có thay đổi — gửi đủ body (không dựa vào ngữ nghĩa "vắng mặt = giữ nguyên" của bool). */
  updates: { id: string; body: Required<CreateTestCaseDTO> }[];
  creates: Required<CreateTestCaseDTO>[];
  deletes: string[];
}

export function limitsDraftFromExercise(exercise: Pick<Exercise, "time_limit" | "memory_limit" | "pass_percentage">): ExerciseLimitsDraft {
  const text = (v: number | undefined) => (v === undefined || v === null ? "" : String(v));
  return {
    timeLimit: text(exercise.time_limit),
    memoryLimit: text(exercise.memory_limit),
    passPercentage: text(exercise.pass_percentage),
  };
}

const sortByOrder = (testCases: readonly TestCase[]) => [...testCases].sort((a, b) => a.display_order - b.display_order);

export function draftsFromTestCases(testCases: readonly TestCase[]): ExerciseTestCaseDraft[] {
  return sortByOrder(testCases).map((tc) => ({ id: tc.id, serverId: tc.id, input: tc.input, output: tc.expected_output ?? "", hidden: tc.is_hidden }));
}

/** `display_order` của test ở vị trí `index` (0-based): đánh số 1..n như seed, postman và các form khác. */
const testCaseDisplayOrder = (index: number): number => index + 1;

const toBody = (draft: ExerciseTestCaseDraft, index: number): Required<CreateTestCaseDTO> => ({
  input: draft.input,
  expected_output: draft.output,
  is_hidden: draft.hidden,
  display_order: testCaseDisplayOrder(index),
});

export function hasTestCaseChanges(plan: ExerciseEditPlan): boolean {
  return plan.updates.length + plan.creates.length + plan.deletes.length > 0;
}

/**
 * `limits` = các giới hạn GIẢNG VIÊN ĐÃ ĐỔI và đã kiểm hợp lệ (trường vắng mặt = không đụng tới), hoặc `null`.
 * Trả `null` khi không có gì để lưu.
 */
export function buildExerciseEditPlan(
  original: { exercise: Pick<Exercise, "time_limit" | "memory_limit" | "pass_percentage">; testCases: readonly TestCase[] },
  drafts: readonly ExerciseTestCaseDraft[],
  limits: Partial<ExerciseLimitsPayload> | null,
): ExerciseEditPlan | null {
  const exerciseUpdate: UpdateExerciseDTO = {};
  if (limits) {
    const { time_limit, memory_limit, pass_percentage } = limits;
    if (time_limit !== undefined && time_limit !== original.exercise.time_limit) exerciseUpdate.time_limit = time_limit;
    if (memory_limit !== undefined && memory_limit !== original.exercise.memory_limit) exerciseUpdate.memory_limit = memory_limit;
    if (pass_percentage !== undefined && pass_percentage !== original.exercise.pass_percentage)
      exerciseUpdate.pass_percentage = pass_percentage;
  }

  const byId = new Map(original.testCases.map((tc) => [tc.id, tc]));
  const kept = new Set<string>();
  const plan: ExerciseEditPlan = {
    exerciseUpdate: Object.keys(exerciseUpdate).length > 0 ? exerciseUpdate : null,
    updates: [],
    creates: [],
    deletes: [],
  };

  drafts.forEach((draft, index) => {
    const body = toBody(draft, index);
    const saved = draft.serverId ? byId.get(draft.serverId) : undefined;
    if (!saved) {
      plan.creates.push(body);
      return;
    }
    kept.add(saved.id);
    // So với `display_order` ĐÃ LƯU (không phải vị trí): mỗi test có một số đích duy nhất, test nào lệch thì
    // được ghi lại. So theo vị trí để lại số cũ của test không đụng tới và sinh số trùng (1,1,2,4).
    const changed =
      saved.input !== body.input ||
      (saved.expected_output ?? "") !== body.expected_output ||
      saved.is_hidden !== body.is_hidden ||
      saved.display_order !== body.display_order;
    if (changed) plan.updates.push({ id: saved.id, body });
  });
  plan.deletes = original.testCases.filter((tc) => !kept.has(tc.id)).map((tc) => tc.id);

  return plan.exerciseUpdate || hasTestCaseChanges(plan) ? plan : null;
}

/**
 * Áp dụng tuần tự: giới hạn → sửa → thêm → xoá. Xoá để CUỐI: lỗi giữa chừng chỉ để lại test thừa chứ không
 * làm mất test (bài không bao giờ bị rơi vào trạng thái không còn test nào).
 */
export async function applyExerciseEditPlan(exerciseId: string, plan: ExerciseEditPlan): Promise<void> {
  if (plan.exerciseUpdate) await exerciseService.update(exerciseId, plan.exerciseUpdate);
  for (const { id, body } of plan.updates) await exerciseService.updateTestCase(exerciseId, id, body);
  for (const body of plan.creates) await exerciseService.createTestCase(exerciseId, body);
  for (const id of plan.deletes) await exerciseService.deleteTestCase(exerciseId, id);
}
