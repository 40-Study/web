"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { exerciseService } from "@/services/exercise.service";
import {
  ExerciseTestCaseEditor,
  TEST_CASE_SET_RULE_MESSAGE,
  isValidTestCaseSet,
  type ExerciseTestCaseDraft,
} from "./exercise-test-case-editor";
import {
  ExerciseLimitsFields,
  parseExerciseLimits,
  validateExerciseLimits,
  type ExerciseLimitsDraft,
  type ExerciseLimitsErrors,
  type ExerciseLimitsField,
  type ExerciseLimitsPayload,
} from "./exercise-limits-fields";

const LIMIT_KEYS: Record<ExerciseLimitsField, keyof ExerciseLimitsPayload> = {
  timeLimit: "time_limit",
  memoryLimit: "memory_limit",
  passPercentage: "pass_percentage",
};
import {
  buildExerciseEditPlan,
  draftsFromTestCases,
  hasTestCaseChanges,
  limitsDraftFromExercise,
  type ExerciseEditPlan,
} from "./exercise-edit-plan";

/** Khoá cache của bài code đang sửa (bài + toàn bộ test, gồm test ẩn — chỉ người quản lý bài nhận được). */
export const exerciseEditKeys = {
  detail: (exerciseId: string) => ["teacher-exercise", exerciseId] as const,
};

/**
 * Trạng thái báo lên hộp thoại sửa nội dung. `plan` = phần cần lưu (`null` = không đổi gì).
 * `blocked` = có thay đổi nhưng chưa hợp lệ -> hộp thoại không được lưu.
 */
export interface ExerciseSettingsEditState {
  plan: ExerciseEditPlan | null;
  blocked: boolean;
}

interface ExerciseSettingsEditorProps {
  exerciseId: string;
  /** Phải ổn định (vd. setState). */
  onChange: (state: ExerciseSettingsEditState) => void;
}

export function ExerciseSettingsEditor({ exerciseId, onChange }: ExerciseSettingsEditorProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: exerciseEditKeys.detail(exerciseId),
    queryFn: async () => {
      const [exercise, testCases] = await Promise.all([
        exerciseService.getById(exerciseId),
        exerciseService.getTestCases(exerciseId),
      ]);
      return { exercise, testCases: testCases ?? [] };
    },
    enabled: !!exerciseId,
    // Refetch khi quay lại tab sẽ nạp lại form và xoá phần giảng viên đang sửa.
    refetchOnWindowFocus: false,
  });

  const [drafts, setDrafts] = useState<ExerciseTestCaseDraft[]>([]);
  const [limits, setLimits] = useState<ExerciseLimitsDraft>({ timeLimit: "", memoryLimit: "", passPercentage: "" });

  useEffect(() => {
    if (!data) return;
    setDrafts(draftsFromTestCases(data.testCases));
    setLimits(limitsDraftFromExercise(data.exercise));
  }, [data]);

  const state = useMemo<ExerciseSettingsEditState & { limitErrors: ExerciseLimitsErrors; testsInvalid: boolean }>(() => {
    const none = { plan: null, blocked: false, limitErrors: {}, testsInvalid: false };
    if (!data) return none;
    const initialLimits = limitsDraftFromExercise(data.exercise);
    // Chỉ kiểm và chỉ gửi ô giảng viên ĐÃ đổi: giá trị cũ lệch khoảng (bài tạo trước khi backend kiểm) không
    // được chặn việc sửa ô khác, và cũng không bị gửi lại.
    const dirty = (Object.keys(limits) as ExerciseLimitsField[]).filter((k) => limits[k].trim() !== initialLimits[k]);
    const allErrors = validateExerciseLimits(limits);
    const limitErrors: ExerciseLimitsErrors = Object.fromEntries(
      dirty.filter((k) => allErrors[k]).map((k) => [k, allErrors[k]]),
    );
    const limitsValid = Object.keys(limitErrors).length === 0;
    const parsed = parseExerciseLimits(limits);
    const changedLimits = Object.fromEntries(dirty.map((k) => [LIMIT_KEYS[k], parsed[LIMIT_KEYS[k]]]));
    const plan = buildExerciseEditPlan(data, drafts, dirty.length > 0 && limitsValid ? changedLimits : null);
    // Bộ test chỉ chặn lưu khi giảng viên ĐÃ sửa nó: bài cũ lệch luật vẫn đổi được tiêu đề.
    const testsInvalid = !!plan && hasTestCaseChanges(plan) && !isValidTestCaseSet(drafts);
    const blocked = !limitsValid || testsInvalid;
    return { plan: blocked ? null : plan, blocked, limitErrors, testsInvalid };
  }, [data, drafts, limits]);

  const planKey = JSON.stringify(state.plan);
  useEffect(() => {
    onChange({ plan: state.plan, blocked: state.blocked });
  }, [planKey, state.blocked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Gỡ editor (đóng hộp thoại) thì xoá trạng thái cũ để không chặn/lưu nhầm nội dung khác.
  useEffect(() => () => onChange({ plan: null, blocked: false }), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isError) {
    return (
      <p role="alert" className="text-sm text-red-600">
        Không tải được bộ test và giới hạn chấm của bài. Bạn vẫn có thể sửa tiêu đề.
      </p>
    );
  }
  if (isLoading || !data) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải bộ test…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ExerciseLimitsFields value={limits} onChange={setLimits} errors={state.limitErrors} />
      <ExerciseTestCaseEditor testCases={drafts} onChange={setDrafts} />
      {state.testsInvalid && (
        <p role="alert" className="text-sm text-destructive" data-testid="exercise-test-cases-error">
          {TEST_CASE_SET_RULE_MESSAGE}
        </p>
      )}
    </div>
  );
}
