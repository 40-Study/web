"use client";

import { Input } from "@/components/ui/input";

/**
 * Giới hạn chấm của bài thực hành code: thời gian (giây/test), bộ nhớ (MB) và điểm đạt (%).
 * Dùng chung cho form tạo và form sửa. Giá trị trong form là chuỗi (ô nhập), gửi lên là số nguyên.
 */
export interface ExerciseLimitsDraft {
  timeLimit: string;
  memoryLimit: string;
  passPercentage: string;
}

export type ExerciseLimitsField = keyof ExerciseLimitsDraft;
export type ExerciseLimitsErrors = Partial<Record<ExerciseLimitsField, string>>;

export interface ExerciseLimitsPayload {
  time_limit: number;
  memory_limit: number;
  pass_percentage: number;
}

/** Mặc định của backend (`exercise_service.go` CreateExercise): 2 giây, 256 MB, 100%. */
export const DEFAULT_EXERCISE_LIMITS: ExerciseLimitsDraft = {
  timeLimit: "2",
  memoryLimit: "256",
  passPercentage: "100",
};

/**
 * Khoảng cho phép — phản chiếu đúng validate của backend (`internal/dto/exerciseDTO.go`, Create/UpdateExerciseDTO;
 * ngoài khoảng = 400 "Validation failed"): thời gian 1..20 giây CPU mỗi test (Judge0 `MAX_CPU_TIME_LIMIT`),
 * bộ nhớ 16..1500 MB (Judge0 `MAX_MEMORY_LIMIT` = 1536000 KB), điểm đạt 1..100.
 */
export const EXERCISE_LIMIT_BOUNDS: Record<ExerciseLimitsField, { min: number; max: number; label: string }> = {
  timeLimit: { min: 1, max: 20, label: "Giới hạn thời gian (giây/test)" },
  memoryLimit: { min: 16, max: 1500, label: "Giới hạn bộ nhớ (MB)" },
  passPercentage: { min: 1, max: 100, label: "Điểm đạt (%)" },
};

const FIELDS: ExerciseLimitsField[] = ["timeLimit", "memoryLimit", "passPercentage"];

export function validateExerciseLimits(draft: ExerciseLimitsDraft): ExerciseLimitsErrors {
  const errors: ExerciseLimitsErrors = {};
  for (const field of FIELDS) {
    const { min, max } = EXERCISE_LIMIT_BOUNDS[field];
    const text = draft[field].trim();
    const value = Number(text);
    if (text === "" || !Number.isInteger(value) || value < min || value > max) {
      errors[field] = `Nhập số nguyên từ ${min} đến ${max}.`;
    }
  }
  return errors;
}

/** Chỉ gọi sau khi `validateExerciseLimits` không báo lỗi. */
export function parseExerciseLimits(draft: ExerciseLimitsDraft): ExerciseLimitsPayload {
  return {
    time_limit: Number(draft.timeLimit.trim()),
    memory_limit: Number(draft.memoryLimit.trim()),
    pass_percentage: Number(draft.passPercentage.trim()),
  };
}

const HELPER: Record<ExerciseLimitsField, string> = {
  timeLimit: "Mỗi test chạy quá mức này bị tính là quá thời gian.",
  memoryLimit: "Bộ nhớ tối đa chương trình được dùng.",
  passPercentage: "Tỉ lệ test cần đạt để được tính là qua bài.",
};

interface ExerciseLimitsFieldsProps {
  value: ExerciseLimitsDraft;
  onChange: (next: ExerciseLimitsDraft) => void;
  errors?: ExerciseLimitsErrors;
  disabled?: boolean;
}

export function ExerciseLimitsFields({ value, onChange, errors = {}, disabled = false }: ExerciseLimitsFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {FIELDS.map((field) => {
        const { min, max, label } = EXERCISE_LIMIT_BOUNDS[field];
        return (
          <Input
            key={field}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={1}
            label={label}
            value={value[field]}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, [field]: e.target.value })}
            error={errors[field]}
            helperText={HELPER[field]}
          />
        );
      })}
    </div>
  );
}
