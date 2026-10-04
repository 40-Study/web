"use client";

/**
 * Hộp thoại xem bài nộp + nhập điểm/nhận xét của một học viên. Chỉ được mount khi đang mở, nên state của
 * form luôn khởi tạo lại từ điểm đã có của đúng học viên đó.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  GRADE_MAX_SCORE,
  parseScoreInput,
  submissionText,
  type GradingRow,
} from "@/lib/submission-grading";
import type { SubmissionVerdict } from "@/services/submission.service";

const VERDICT_LABELS: Record<SubmissionVerdict, string> = {
  pending: "Đang chờ chấm tự động",
  running: "Đang chạy",
  accepted: "Đạt toàn bộ test",
  wrong_answer: "Sai kết quả",
  time_limit_exceeded: "Quá thời gian",
  memory_limit_exceeded: "Quá bộ nhớ",
  runtime_error: "Lỗi khi chạy",
  compilation_error: "Lỗi biên dịch",
};

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  row: GradingRow;
  /** false khi bài tập chưa gắn lớp nào: sổ điểm tính theo lớp nên không có chỗ lưu điểm. */
  canGrade: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: { score: number; feedback: string }) => Promise<void>;
}

export function SubmissionGradeDialog({ row, canGrade, isSaving, onClose, onSave }: Props) {
  const { submission, grade } = row;
  const [scoreText, setScoreText] = useState(grade ? String(grade.score) : "");
  const [feedback, setFeedback] = useState(grade?.feedback ?? "");
  const [scoreError, setScoreError] = useState<string | undefined>();
  // Điểm đã chấm giữ thang của chính nó (vd 85/100): chặn theo max_score của bản ghi, không ép thang 10, nếu không
  // sẽ không nhập được điểm trên 10 cho bản ghi như vậy. Chấm mới dùng thang mặc định của sổ điểm lớp.
  const maxScore = grade?.max_score && grade.max_score > 0 ? grade.max_score : GRADE_MAX_SCORE;

  const handleSave = async () => {
    const parsed = parseScoreInput(scoreText, maxScore);
    if (!parsed.ok) {
      setScoreError(parsed.message);
      return;
    }
    setScoreError(undefined);
    try {
      await onSave({ score: parsed.value, feedback: feedback.trim() });
      onClose();
    } catch {
      // Toast lỗi đã do hook hiện; giữ hộp thoại mở để giảng viên không mất nội dung đã nhập.
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bài nộp của {row.studentName}</DialogTitle>
          <DialogDescription>
            Nộp lúc {formatDateTime(submission.created_at)}
            {row.attempts > 1 ? ` (lần nộp mới nhất trong ${row.attempts} lần)` : ""}
            {row.late ? " · Nộp muộn" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Bài làm ({submission.language})
            </p>
            <pre
              data-testid="submission-code"
              className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/40 p-3 text-xs"
            >
              {submissionText(submission) || "(bài nộp trống)"}
            </pre>
          </div>

          <p className="text-sm text-muted-foreground">
            Kết quả chạy tự động: <span className="font-medium text-foreground">{VERDICT_LABELS[submission.verdict] ?? submission.verdict}</span>
            {submission.total_test_cases > 0
              ? ` · ${submission.test_cases_passed}/${submission.total_test_cases} test`
              : ""}
            . Đây chỉ là gợi ý, điểm chính thức là điểm bạn nhập bên dưới.
          </p>

          {canGrade ? (
            <div className="space-y-3 rounded-lg border p-3">
              <Input
                label={`Điểm (thang ${maxScore})`}
                inputMode="decimal"
                value={scoreText}
                onChange={(e) => setScoreText(e.target.value)}
                error={scoreError}
                placeholder="Ví dụ 8,5"
              />
              <Textarea
                label="Nhận xét cho học viên"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
              />
              {grade && (
                <p className="text-xs text-muted-foreground">
                  Đã chấm bởi {grade.graded_by_name || "người chấm không rõ"} lúc {formatDateTime(grade.graded_at)}.
                  Lưu lại sẽ ghi bạn là người chấm mới.
                </p>
              )}
            </div>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Bài tập này chưa gắn với lớp nào nên chưa có sổ điểm để lưu điểm.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {canGrade ? "Hủy" : "Đóng"}
          </Button>
          {canGrade && (
            <Button onClick={handleSave} isLoading={isSaving}>
              Lưu điểm
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
