/**
 * Logic thuần cho màn chấm bài (SubmissionGradingPanel): ghép bài nộp với điểm đã chấm, tính trạng thái.
 *
 * TẠI SAO tách khỏi component: "Đã chấm" trước đây suy từ `verdict === "accepted"` (kết quả máy chạy test)
 * nên bài nộp đúng hết vẫn bị coi là đã chấm dù chưa ai chấm, còn bài sai thì không bao giờ "đã chấm".
 * Trạng thái chấm thật chỉ có một nguồn: bản ghi điểm (`Grade`) gắn `assignment_id` + `student_id`.
 */

import type { Grade } from "@/services/grade.service";
import type { SubmissionResponseDTO } from "@/services/submission.service";

/** Thang điểm của sổ điểm lớp (seed và màn nhập điểm đều dùng thang 10). */
export const GRADE_MAX_SCORE = 10;

export type GradingStatus = "graded" | "ungraded";

export interface GradingRow {
  studentId: string;
  studentName: string;
  /** Bài nộp mới nhất của học viên (một học viên có thể nộp nhiều lần). */
  submission: SubmissionResponseDTO;
  attempts: number;
  late: boolean;
  grade?: Grade;
  status: GradingStatus;
}

/** Nộp muộn = sau hạn + thời gian ân hạn. So sánh theo mốc thời gian, không so chuỗi ISO (khác offset). */
export function isLateSubmission(createdAt: string, endTime?: string | null, graceMinutes = 0): boolean {
  if (!endTime) return false;
  const submitted = new Date(createdAt).getTime();
  const deadline = new Date(endTime).getTime();
  if (Number.isNaN(submitted) || Number.isNaN(deadline)) return false;
  return submitted > deadline + Math.max(0, graceMinutes) * 60_000;
}

interface BuildRowsInput {
  submissions: SubmissionResponseDTO[];
  grades: Grade[];
  assignmentId: string;
  endTime?: string | null;
  graceMinutes?: number;
}

/**
 * Mỗi học viên một dòng: bài nộp mới nhất + điểm (nếu đã chấm). Chưa chấm xếp trước để giảng viên thấy việc
 * còn lại; trong cùng nhóm xếp theo tên.
 */
export function buildGradingRows({
  submissions,
  grades,
  assignmentId,
  endTime,
  graceMinutes = 0,
}: BuildRowsInput): GradingRow[] {
  const byStudent = new Map<string, SubmissionResponseDTO[]>();
  for (const sub of submissions) {
    const list = byStudent.get(sub.user_id) ?? [];
    list.push(sub);
    byStudent.set(sub.user_id, list);
  }

  const gradeByStudent = new Map<string, Grade>();
  for (const g of grades) {
    if (g.assignment_id === assignmentId) gradeByStudent.set(g.student_id, g);
  }

  const rows: GradingRow[] = [];
  byStudent.forEach((list, studentId) => {
    const latest = list.reduce((a, b) =>
      new Date(b.created_at).getTime() >= new Date(a.created_at).getTime() ? b : a,
    );
    const grade = gradeByStudent.get(studentId);
    rows.push({
      studentId,
      studentName: grade?.student_name || latest.user?.username || studentId,
      submission: latest,
      attempts: list.length,
      late: isLateSubmission(latest.created_at, endTime, graceMinutes),
      grade,
      status: grade ? "graded" : "ungraded",
    });
  });

  return rows.sort((a, b) => {
    if (a.status !== b.status) return a.status === "ungraded" ? -1 : 1;
    return a.studentName.localeCompare(b.studentName, "vi");
  });
}

export type ScoreParse = { ok: true; value: number } | { ok: false; message: string };

/** Điểm nhập tay: chấp nhận dấu phẩy thập phân kiểu Việt ("8,5"), chặn rỗng/ngoài thang. */
export function parseScoreInput(raw: string, max = GRADE_MAX_SCORE): ScoreParse {
  const text = raw.trim().replace(",", ".");
  if (text === "") return { ok: false, message: "Nhập điểm" };
  const value = Number(text);
  if (!Number.isFinite(value)) return { ok: false, message: "Điểm phải là một số" };
  if (value < 0 || value > max) return { ok: false, message: `Điểm phải từ 0 đến ${max}` };
  return { ok: true, value };
}

/**
 * Bài tự luận nộp dạng HTML (RichTextEditor), trắc nghiệm nộp JSON. Hiển thị cho người chấm dưới dạng văn
 * bản thuần để không phải render HTML do học viên gửi.
 */
export function submissionText(sub: Pick<SubmissionResponseDTO, "language" | "code">): string {
  if (sub.language !== "text") return sub.code;
  return sub.code
    .replace(/<\s*(br|\/p|\/div|\/li)\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

/** Tên bản ghi điểm cho bài tập, cùng quy ước với dữ liệu seed ("Bài tập: <tên>"). */
export function gradeTitleFor(assignmentTitle: string): string {
  return `Bài tập: ${assignmentTitle}`;
}
