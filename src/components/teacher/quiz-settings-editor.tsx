"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useQuiz } from "@/hooks/queries/use-quiz";
import { validateQuizSettings } from "@/lib/quiz-settings";
import type { UpdateQuizDTO } from "@/services/quiz.service";

/**
 * Trạng thái báo lên hộp thoại sửa nội dung (QA2 Q2-04, smoke2).
 * `payload` chỉ chứa trường GIẢNG VIÊN ĐÃ ĐỔI (PUT bỏ trường = giữ nguyên; `max_attempts` không xoá được),
 * `null` = không có gì để lưu. `blocked` = có trường đã đổi nhưng không hợp lệ -> hộp thoại không được lưu.
 */
export interface QuizSettingsEditState {
  payload: Pick<UpdateQuizDTO, "pass_percentage" | "max_attempts"> | null;
  blocked: boolean;
}

interface QuizSettingsEditorProps {
  quizId: string;
  /** Phải ổn định (vd. setState) — được gọi mỗi khi `payload`/`blocked` đổi. */
  onChange: (state: QuizSettingsEditState) => void;
}

/** Số backend trả (number hoặc decimal dạng chuỗi) -> chuỗi ô nhập; thiếu/null -> rỗng. */
function toFieldText(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "";
}

/**
 * Điểm đạt (%) và số lần làm tối đa của một bài trắc nghiệm ĐÃ TẠO: nạp từ `GET /quizzes/:id`, kiểm cùng luật
 * với form tạo (`validateQuizSettings`). Chỉ báo lỗi cho ô đã đổi để quiz cũ chưa có `max_attempts` không bị
 * chặn lưu tiêu đề.
 */
export function QuizSettingsEditor({ quizId, onChange }: QuizSettingsEditorProps) {
  const { data: quiz, isLoading, isError } = useQuiz(quizId);
  const [passPercentage, setPassPercentage] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("");

  const initialPass = toFieldText(quiz?.pass_percentage);
  const initialAttempts = toFieldText(quiz?.max_attempts);
  useEffect(() => {
    if (!quiz) return;
    setPassPercentage(initialPass);
    setMaxAttempts(initialAttempts);
    // Nạp lại khi đổi sang quiz khác; không ghi đè khi refetch cùng giá trị.
  }, [quiz?.id, initialPass, initialAttempts]); // eslint-disable-line react-hooks/exhaustive-deps

  const state = useMemo<QuizSettingsEditState & { errors: ReturnType<typeof validateQuizSettings> }>(() => {
    const errors = validateQuizSettings({ passPercentage, maxAttempts });
    if (!quiz) return { payload: null, blocked: false, errors: {} };
    const passDirty = passPercentage.trim() !== initialPass;
    const attemptsDirty = maxAttempts.trim() !== initialAttempts;
    const visible = {
      ...(passDirty && errors.passPercentage ? { passPercentage: errors.passPercentage } : {}),
      ...(attemptsDirty && errors.maxAttempts ? { maxAttempts: errors.maxAttempts } : {}),
    };
    if (Object.keys(visible).length > 0) return { payload: null, blocked: true, errors: visible };
    // Mỗi trường đã đổi và hợp lệ mới vào payload; trường chưa đổi (kể cả max_attempts rỗng của quiz cũ) bị bỏ.
    const payload: QuizSettingsEditState["payload"] = {};
    if (passDirty) payload.pass_percentage = Number(passPercentage.trim());
    if (attemptsDirty) payload.max_attempts = Number(maxAttempts.trim());
    return { payload: Object.keys(payload).length > 0 ? payload : null, blocked: false, errors: {} };
  }, [quiz, passPercentage, maxAttempts, initialPass, initialAttempts]);

  const payloadKey = JSON.stringify(state.payload);
  useEffect(() => {
    onChange({ payload: state.payload, blocked: state.blocked });
    // payloadKey đại diện cho nội dung payload (object mới mỗi lần tính).
  }, [payloadKey, state.blocked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Gỡ editor (đóng hộp thoại / đổi sang nội dung khác) thì xoá trạng thái cũ để không chặn lưu nhầm.
  useEffect(() => () => onChange({ payload: null, blocked: false }), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isError) {
    return (
      <p role="alert" className="text-sm text-red-600">
        Không tải được cài đặt bài trắc nghiệm (điểm đạt, số lần làm). Bạn vẫn có thể sửa tiêu đề.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        max={100}
        label="Điểm đạt (%)"
        value={passPercentage}
        onChange={(e) => setPassPercentage(e.target.value)}
        disabled={isLoading}
        error={state.errors.passPercentage}
        helperText="Học viên đạt từ mức này trở lên được tính là qua bài."
      />
      <Input
        type="number"
        inputMode="numeric"
        min={1}
        max={100}
        step={1}
        label="Số lần làm tối đa"
        value={maxAttempts}
        onChange={(e) => setMaxAttempts(e.target.value)}
        disabled={isLoading}
        error={state.errors.maxAttempts}
        helperText="Chỉ tính các lượt làm bài chính thức."
      />
    </div>
  );
}
