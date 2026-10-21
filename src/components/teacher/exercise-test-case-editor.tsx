"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Bộ test của bài thực hành code — dùng chung cho form TẠO (`add-content-modal`) và form SỬA
 * (`exercise-settings-editor`), để hai nơi luôn cùng giao diện và cùng luật kiểm tra.
 */
export interface ExerciseTestCaseDraft {
  /** Khoá React cục bộ (không phải id backend). */
  id: string;
  input: string;
  /** Đầu ra mong đợi (`expected_output` của backend). */
  output: string;
  hidden: boolean;
  /** Id test đã lưu trên backend; vắng mặt = test mới thêm trong form. */
  serverId?: string;
}

export const MAX_EXERCISE_TEST_CASES = 20;

export const newTestCaseDraft = (): ExerciseTestCaseDraft => ({
  id: Math.random().toString(36).slice(2, 9),
  input: "",
  output: "",
  hidden: false,
});

/**
 * Luật tối thiểu của một bộ test hợp lệ: 1..20 test, mỗi test có đầu vào và kết quả mong đợi (backend trả
 * 400 cho `input`/`expected_output` rỗng, cả lúc tạo lẫn lúc sửa), và ít nhất một test công khai (học viên
 * cần một test mẫu để hiểu đề). Trả `true` khi hợp lệ.
 */
export function isValidTestCaseSet(testCases: readonly ExerciseTestCaseDraft[]): boolean {
  return (
    testCases.length > 0 &&
    testCases.length <= MAX_EXERCISE_TEST_CASES &&
    testCases.some((test) => !test.hidden) &&
    testCases.every((test) => test.input.trim() !== "" && test.output.trim() !== "")
  );
}

export const TEST_CASE_SET_RULE_MESSAGE =
  "Cần từ 1 đến 20 test, mỗi test có đầu vào và kết quả mong đợi, gồm ít nhất một test mẫu công khai.";

interface ExerciseTestCaseEditorProps {
  testCases: ExerciseTestCaseDraft[];
  onChange: (next: ExerciseTestCaseDraft[]) => void;
  disabled?: boolean;
}

export function ExerciseTestCaseEditor({ testCases, onChange, disabled = false }: ExerciseTestCaseEditorProps) {
  const update = (id: string, patch: Partial<ExerciseTestCaseDraft>) =>
    onChange(testCases.map((tc) => (tc.id === id ? { ...tc, ...patch } : tc)));
  const remove = (id: string) => onChange(testCases.filter((tc) => tc.id !== id));
  const add = () => onChange([...testCases, newTestCaseDraft()]);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Bộ kiểm thử</label>
      {testCases.map((tc, idx) => (
        <div key={tc.id} className="border rounded-xl p-3 space-y-2" data-testid={`test-case-${idx}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary-600">Test #{idx + 1}</span>
            {testCases.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(tc.id)}
                disabled={disabled}
                aria-label={`Xoá test ${idx + 1}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={tc.hidden}
              disabled={disabled}
              onChange={(e) => update(tc.id, { hidden: e.target.checked })}
            />
            Test ẩn {idx + 1}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Textarea
              aria-label={`Đầu vào test ${idx + 1}`}
              placeholder="Đầu vào"
              value={tc.input}
              disabled={disabled}
              onChange={(e) => update(tc.id, { input: e.target.value })}
              rows={2}
            />
            <Textarea
              aria-label={`Đầu ra mong đợi test ${idx + 1}`}
              placeholder="Đầu ra mong đợi"
              value={tc.output}
              disabled={disabled}
              onChange={(e) => update(tc.id, { output: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        onClick={add}
        className="w-full"
        disabled={disabled || testCases.length >= MAX_EXERCISE_TEST_CASES}
      >
        <Plus className="w-4 h-4 mr-1" /> Thêm test case
      </Button>
    </div>
  );
}
