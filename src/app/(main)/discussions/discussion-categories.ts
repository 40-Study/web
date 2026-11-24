/**
 * Danh mục diễn đàn — dùng chung cho thanh bên, thẻ bài, ô soạn bài và trang (đếm tổng theo danh mục).
 *
 * `DISCUSSION_CATEGORIES` là các giá trị backend chấp nhận khi đăng bài (`oneof` ở discussionDTO) và lọc được bằng
 * `?category=`. "Chung" KHÔNG nằm ở đó: bài `general` và bài không có danh mục (dữ liệu cũ) đều là "Chung", và số
 * của nó là phần còn lại của tổng, nên cộng các chip luôn bằng "Tất cả" (Q6-PG-13).
 */
export const DISCUSSION_CATEGORIES = [
  { value: "programming", label: "Lập trình", emoji: "💻" },
  { value: "design", label: "Thiết kế", emoji: "🎨" },
  { value: "learning-tips", label: "Mẹo học", emoji: "💡" },
  { value: "project", label: "Dự án", emoji: "🚀" },
  { value: "qna", label: "Hỏi đáp", emoji: "❓" },
] as const;

export const GENERAL_DISCUSSION_CATEGORY = { value: "general", label: "Chung", emoji: "💬" } as const;

/** Nhãn tiếng Việt của danh mục bài; giá trị lạ, `general` hoặc thiếu đều là "Chung". */
export function discussionCategoryLabel(category: string | null | undefined): string {
  return DISCUSSION_CATEGORIES.find((c) => c.value === category)?.label ?? GENERAL_DISCUSSION_CATEGORY.label;
}

/**
 * Số bài "Chung" = tổng trừ số của mọi danh mục có tên. Thiếu tổng hoặc thiếu số của một danh mục (chưa tải xong)
 * thì chưa biết: trả undefined để chip hiện "–" thay vì một số sai.
 */
export function generalDiscussionCount(
  total: number | undefined,
  counts: Record<string, number>
): number | undefined {
  if (total === undefined) return undefined;
  let named = 0;
  for (const { value } of DISCUSSION_CATEGORIES) {
    const n = counts[value];
    if (n === undefined) return undefined;
    named += n;
  }
  return Math.max(0, total - named);
}
