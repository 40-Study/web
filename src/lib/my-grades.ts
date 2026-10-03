/**
 * Nhóm điểm của học viên (GET /me/grades là danh sách phẳng) theo lớp để trang "Điểm của tôi" hiển thị.
 */

import type { Grade } from "@/services/grade.service";

export interface ClassGradeGroup {
  classId: string;
  className: string;
  /** Mới chấm xếp trước. */
  grades: Grade[];
}

const FALLBACK_CLASS_NAME = "Lớp học";

function gradedTime(g: Grade): number {
  const t = g.graded_at ? new Date(g.graded_at).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
}

/** Lớp có điểm mới nhất xếp trước; trong lớp, điểm mới chấm xếp trước. */
export function groupGradesByClass(grades: Grade[]): ClassGradeGroup[] {
  const groups = new Map<string, ClassGradeGroup>();
  for (const g of grades) {
    const group = groups.get(g.class_id) ?? {
      classId: g.class_id,
      className: g.class_name || FALLBACK_CLASS_NAME,
      grades: [],
    };
    // Tên lớp có thể vắng ở dòng đầu nhưng có ở dòng sau: lấy tên thật đầu tiên gặp.
    if (group.className === FALLBACK_CLASS_NAME && g.class_name) group.className = g.class_name;
    group.grades.push(g);
    groups.set(g.class_id, group);
  }
  const list = Array.from(groups.values());
  for (const group of list) group.grades.sort((a, b) => gradedTime(b) - gradedTime(a));
  return list.sort((a, b) => gradedTime(b.grades[0]) - gradedTime(a.grades[0]));
}

export type ScoreTone = "good" | "ok" | "low";

/** Màu điểm theo tỉ lệ trên thang của chính bản ghi (không giả định thang 10). */
export function scoreTone(score: number, maxScore: number): ScoreTone {
  if (!(maxScore > 0)) return "low";
  const ratio = score / maxScore;
  if (ratio >= 0.8) return "good";
  if (ratio >= 0.5) return "ok";
  return "low";
}
