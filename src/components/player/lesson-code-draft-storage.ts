/**
 * Bản nháp bài tập code lưu trên trình duyệt (localStorage): mã theo từng ngôn ngữ + ngôn ngữ đang chọn,
 * để tải lại trang mở đúng ngôn ngữ người học đang viết thay vì quay về ngôn ngữ đầu tiên.
 */
export interface LessonCodeDraft {
  language?: string;
  drafts: Record<string, string>;
}

const onlyStrings = (value: unknown): Record<string, string> =>
  value && typeof value === "object"
    ? Object.fromEntries(
        Object.entries(value).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string"
        )
      )
    : {};

/** Đọc bản nháp; dạng cũ (chỉ map ngôn ngữ -> mã, trước khi lưu ngôn ngữ) vẫn đọc được. Hỏng -> rỗng. */
export function readLessonCodeDraft(storageKey: string): LessonCodeDraft {
  let parsed: unknown;
  try {
    parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch {
    return { drafts: {} };
  }
  if (!parsed || typeof parsed !== "object") return { drafts: {} };
  const stored = parsed as { language?: unknown; drafts?: unknown };
  if (stored.drafts && typeof stored.drafts === "object")
    return {
      language: typeof stored.language === "string" ? stored.language : undefined,
      drafts: onlyStrings(stored.drafts),
    };
  return { drafts: onlyStrings(parsed) };
}

/** Ghi bản nháp; ném lỗi khi trình duyệt từ chối (hết dung lượng, chế độ riêng tư) để nơi gọi báo người học. */
export function writeLessonCodeDraft(storageKey: string, draft: LessonCodeDraft): void {
  localStorage.setItem(storageKey, JSON.stringify(draft));
}
