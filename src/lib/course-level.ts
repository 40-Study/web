/** Nhãn tiếng Việt cho trình độ khoá học (backend: beginner | intermediate | advanced | all_levels). */
const COURSE_LEVEL_LABELS: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
  all_levels: "Mọi trình độ",
  all: "Mọi trình độ",
};

/** Mã lạ vẫn hiển thị được thay vì để trống; mã rỗng trả "—". */
export function courseLevelLabel(level: string | null | undefined): string {
  if (!level) return "—";
  return COURSE_LEVEL_LABELS[level.toLowerCase()] ?? level;
}