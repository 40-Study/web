import { foldSearchText } from "@/lib/text-search";

/** Số mục nhảy khi bấm PageUp/PageDown, giống <select> gốc trên Chrome. */
const PAGE_STEP = 10;

/**
 * Vị trí mục kế tiếp khi bấm phím điều hướng trong listbox. Trả `null` nếu phím không phải phím điều hướng
 * hoặc danh sách rỗng. Không xoay vòng ở hai đầu (theo mẫu listbox của WAI-ARIA APG).
 */
export function getNavigatedIndex(key: string, current: number, count: number): number | null {
  if (count === 0) return null;
  switch (key) {
    case "ArrowDown":
      return current < 0 ? 0 : Math.min(current + 1, count - 1);
    case "ArrowUp":
      return current < 0 ? count - 1 : Math.max(current - 1, 0);
    case "Home":
      return 0;
    case "End":
      return count - 1;
    case "PageDown":
      return Math.min(Math.max(current, 0) + PAGE_STEP, count - 1);
    case "PageUp":
      return Math.max(current - PAGE_STEP, 0);
    default:
      return null;
  }
}

/**
 * Tìm mục để nhảy tới khi người dùng gõ chữ. So khớp đầu nhãn, không dấu, không phân biệt hoa thường
 * ("tat" khớp "Tất cả"). Gõ lặp một chữ ("t", "tt") thì xoay vòng qua các mục cùng chữ đầu như <select> gốc;
 * gõ chuỗi dài thì tìm từ mục hiện tại để mục đang khớp không bị bỏ qua. Không thấy trả -1.
 */
export function findTypeaheadIndex(labels: readonly string[], query: string, current: number): number {
  const folded = foldSearchText(query);
  if (!folded) return -1;
  const isRepeatedChar = folded.split("").every((char) => char === folded[0]);
  const needle = isRepeatedChar ? folded[0] : folded;
  const start = needle.length === 1 ? current + 1 : Math.max(current, 0);
  for (let offset = 0; offset < labels.length; offset++) {
    const index = (start + offset) % labels.length;
    if (foldSearchText(labels[index]).startsWith(needle)) return index;
  }
  return -1;
}

/** Phím in được (chữ, số, dấu cách) không kèm Ctrl/Alt/Meta: dùng cho gõ để nhảy. */
export function isTypeaheadKey(event: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean }): boolean {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}
