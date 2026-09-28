"use client";

/**
 * Form tạo/sửa cuộc thi của GIẢNG VIÊN. Không có ô voucher (contract §7: giảng viên không được gắn
 * voucher — admin gắn lúc duyệt). Bước 1: chọn hoặc tạo bài trắc nghiệm; bước 2: lịch, giải.
 */

import { useState } from "react";

import { QuizBuilder } from "@/components/contest-manage/quiz-builder";
import { PrizeEditor } from "@/components/contest-manage/prize-editor";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useContestQuizOptions } from "@/hooks/queries/use-contest-manage";
import {
  toUpsertRequest,
  validateContestForm,
  type ContestFormErrors,
  type ContestFormValues,
} from "@/lib/contest-manage/form";
import type { ContestQuizBrief, ContestUpsertRequest } from "@/types/contest";

const FIELD =
  "h-10 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900";

interface ContestFormProps {
  initialValues: ContestFormValues;
  /** Quiz đang gắn (khi sửa) — quiz-options không liệt kê quiz đã gắn cuộc thi nên phải thêm vào. */
  currentQuiz?: ContestQuizBrief | null;
  submitLabel: string;
  isPending?: boolean;
  onSubmit: (body: ContestUpsertRequest) => void;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-red-600">
      {message}
    </p>
  );
}

export function ContestForm({ initialValues, currentQuiz, submitLabel, isPending, onSubmit }: ContestFormProps) {
  const [values, setValues] = useState<ContestFormValues>(initialValues);
  const [errors, setErrors] = useState<ContestFormErrors>({});
  const [buildingQuiz, setBuildingQuiz] = useState(false);
  const quizOptions = useContestQuizOptions();

  const set = <K extends keyof ContestFormValues>(key: K, value: ContestFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const options = [
    ...(currentQuiz ? [currentQuiz] : []),
    ...(quizOptions.data ?? []).filter((q) => q.id !== currentQuiz?.id),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateContestForm(values, new Date(), { allowVoucher: false });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit(toUpsertRequest(values));
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6" data-testid="contest-form">
      <section className="space-y-3 rounded-xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="font-semibold">1. Bài trắc nghiệm</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Chỉ dùng bài trắc nghiệm riêng cho cuộc thi (không gắn bài học), có ít nhất 1 câu, không có câu tự luận
          và chưa ai làm. Sau khi gửi duyệt, đề bị khoá không sửa được.
        </p>
        {quizOptions.isError && (
          <p role="alert" className="text-sm text-red-600">
            Không tải được danh sách bài trắc nghiệm.{" "}
            <button type="button" className="underline" onClick={() => quizOptions.refetch()}>
              Thử lại
            </button>
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={values.quiz_id}
            onChange={(e) => set("quiz_id", e.target.value)}
            className={FIELD}
            aria-label="Chọn bài trắc nghiệm"
            aria-describedby="err-quiz"
            data-testid="quiz-select"
            disabled={quizOptions.isLoading}
          >
            <option value="">{quizOptions.isLoading ? "Đang tải..." : "Chọn bài trắc nghiệm"}</option>
            {options.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.question_count} câu)
              </option>
            ))}
          </select>
          {!buildingQuiz && (
            <Button type="button" variant="outline" onClick={() => setBuildingQuiz(true)} data-testid="open-quiz-builder">
              Tạo bài mới
            </Button>
          )}
        </div>
        {!quizOptions.isLoading && options.length === 0 && !buildingQuiz && (
          <p className="text-sm text-gray-500">Bạn chưa có bài trắc nghiệm đủ điều kiện. Hãy tạo bài mới.</p>
        )}
        <FieldError id="err-quiz" message={errors.quiz_id} />
        {buildingQuiz && (
          <QuizBuilder
            onCancel={() => setBuildingQuiz(false)}
            onCreated={async (quizId) => {
              setBuildingQuiz(false);
              await quizOptions.refetch();
              set("quiz_id", quizId);
            }}
          />
        )}
      </section>

      <section className="space-y-4 rounded-xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="font-semibold">2. Thông tin cuộc thi</h2>
        <div>
          <label htmlFor="contest-title" className="mb-1 block text-sm font-medium">
            Tên cuộc thi <span className="text-red-500">*</span>
          </label>
          <input
            id="contest-title"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={255}
            className={FIELD}
            aria-describedby="err-title"
          />
          <FieldError id="err-title" message={errors.title} />
        </div>
        <div>
          <label htmlFor="contest-description" className="mb-1 block text-sm font-medium">
            Mô tả
          </label>
          <textarea
            id="contest-description"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="contest-banner" className="mb-1 block text-sm font-medium">
            Ảnh bìa (đường dẫn)
          </label>
          <input
            id="contest-banner"
            value={values.banner_url}
            onChange={(e) => set("banner_url", e.target.value)}
            placeholder="https://..."
            className={FIELD}
          />
          <FieldError id="err-banner" message={errors.banner_url} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contest-start" className="mb-1 block text-sm font-medium">
              Bắt đầu <span className="text-red-500">*</span>
            </label>
            <input
              id="contest-start"
              type="datetime-local"
              value={values.start_time}
              onChange={(e) => set("start_time", e.target.value)}
              className={FIELD}
            />
            <FieldError id="err-start" message={errors.start_time} />
          </div>
          <div>
            <label htmlFor="contest-end" className="mb-1 block text-sm font-medium">
              Kết thúc <span className="text-red-500">*</span>
            </label>
            <input
              id="contest-end"
              type="datetime-local"
              value={values.end_time}
              onChange={(e) => set("end_time", e.target.value)}
              className={FIELD}
            />
            <FieldError id="err-end" message={errors.end_time} />
          </div>
          <div>
            <label htmlFor="contest-duration" className="mb-1 block text-sm font-medium">
              Thời lượng làm bài (phút) <span className="text-red-500">*</span>
            </label>
            <input
              id="contest-duration"
              type="number"
              min={1}
              max={600}
              value={values.duration_minutes}
              onChange={(e) => set("duration_minutes", e.target.value)}
              className={FIELD}
            />
            <FieldError id="err-duration" message={errors.duration_minutes} />
          </div>
          <div>
            <label htmlFor="contest-max" className="mb-1 block text-sm font-medium">
              Số người tối đa (0 = không giới hạn)
            </label>
            <input
              id="contest-max"
              type="number"
              min={0}
              value={values.max_participants}
              onChange={(e) => set("max_participants", e.target.value)}
              className={FIELD}
            />
            <FieldError id="err-max" message={errors.max_participants} />
          </div>
          <div>
            <label htmlFor="contest-cert" className="mb-1 block text-sm font-medium">
              Ngưỡng % để nhận chứng nhận (bỏ trống = không phát theo ngưỡng)
            </label>
            <input
              id="contest-cert"
              type="number"
              min={0}
              max={100}
              value={values.certificate_min_percentage}
              onChange={(e) => set("certificate_min_percentage", e.target.value)}
              className={FIELD}
            />
            <FieldError id="err-cert" message={errors.certificate_min_percentage} />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch
              checked={values.is_public}
              onCheckedChange={(v) => set("is_public", v)}
              aria-label="Hiện ở danh sách công khai"
            />
            <span className="text-sm">Hiện ở danh sách cuộc thi công khai</span>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="font-semibold">3. Giải thưởng</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Giảng viên chỉ trao chứng nhận theo hạng. Giải voucher do quản trị viên gắn khi duyệt.
        </p>
        <PrizeEditor
          value={values.prizes}
          onChange={(prizes) => set("prizes", prizes)}
          allowVoucher={false}
          error={errors.prizes}
        />
      </section>

      <div className="flex justify-end">
        <Button type="submit" isLoading={isPending} data-testid="contest-form-submit">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
