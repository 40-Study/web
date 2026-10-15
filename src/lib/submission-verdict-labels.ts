/**
 * Nhãn tiếng Việt + tông badge cho verdict bài nộp (contract sec. 2). Cách gọi khớp
 * `components/code_sanbox/judge-status.ts` ("Được chấp nhận", "Sai đáp án", "Lỗi biên dịch"...).
 * `tone` là tên variant của `components/ui/badge.tsx`.
 */

import type { SubmissionVerdict } from "@/services/exercise.service";

export type SubmissionVerdictTone = "success" | "destructive" | "warning" | "secondary";

export interface SubmissionVerdictLabel {
  label: string;
  tone: SubmissionVerdictTone;
}

export const SUBMISSION_VERDICT_LABELS: Record<SubmissionVerdict, SubmissionVerdictLabel> = {
  pending: { label: "Đang chờ chấm", tone: "secondary" },
  running: { label: "Đang chấm", tone: "secondary" },
  accepted: { label: "Được chấp nhận", tone: "success" },
  wrong_answer: { label: "Sai đáp án", tone: "destructive" },
  compilation_error: { label: "Lỗi biên dịch", tone: "destructive" },
  runtime_error: { label: "Lỗi khi chạy", tone: "destructive" },
  time_limit_exceeded: { label: "Vượt quá thời gian", tone: "destructive" },
  memory_limit_exceeded: { label: "Vượt quá bộ nhớ", tone: "destructive" },
  // Hai verdict cuối là lỗi phía hệ thống, người học nộp lại được: tông cảnh báo, không phải "sai".
  system_error: { label: "Lỗi hệ thống", tone: "warning" },
  judge_unavailable: { label: "Máy chấm tạm thời không khả dụng", tone: "warning" },
};
