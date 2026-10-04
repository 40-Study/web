/**
 * Nhãn tiếng Việt cho mã tiếng Anh mà backend trả ở trang theo dõi của phụ huynh (QA A-25): loại điểm
 * (`grade_type`), loại bài tập (`type`), độ khó, tên phòng. Mã lạ không có trong bảng thì KHÔNG in mã thô.
 */

const GRADE_TYPE_LABELS: Record<string, string> = {
  assignment: "Bài tập",
  quiz: "Kiểm tra nhanh",
  midterm: "Giữa kỳ",
  final: "Cuối kỳ",
  attendance: "Chuyên cần",
  participation: "Tham gia",
  project: "Dự án",
  other: "Khác",
};

const ASSIGNMENT_TYPE_LABELS: Record<string, string> = {
  live_coding: "Code trực tiếp",
  homework: "Bài về nhà",
  project: "Dự án",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

export function gradeTypeLabel(type: string | null | undefined): string {
  return GRADE_TYPE_LABELS[(type ?? "").toLowerCase()] ?? "Khác";
}

/** null khi mã lạ: nơi gọi bỏ phần này thay vì hiện mã tiếng Anh. */
export function assignmentTypeLabel(type: string | null | undefined): string | null {
  return ASSIGNMENT_TYPE_LABELS[(type ?? "").toLowerCase()] ?? null;
}

export function difficultyLabel(difficulty: string | null | undefined): string | null {
  return DIFFICULTY_LABELS[(difficulty ?? "").toLowerCase()] ?? null;
}

/** Tên phòng đã có chữ "Phòng" ("Phòng 301") thì giữ nguyên, tránh "P.Phòng 301"; còn lại thêm "Phòng". */
export function roomLabel(room: string): string {
  const name = room.trim();
  return /^phòng\b/i.test(name) ? name : `Phòng ${name}`;
}