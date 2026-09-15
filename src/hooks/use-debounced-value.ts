"use client";

import { useEffect, useState } from "react";

/**
 * Trả về giá trị đã trì hoãn `delay` ms kể từ lần đổi cuối cùng.
 *
 * Dùng cho các ô search/lọc gọi API theo từng ký tự: gõ "nguyen van a" mà
 * không debounce sẽ bắn 12 request. Với `useDebouncedValue(keyword, 300)`,
 * request chỉ chạy sau khi người dùng ngừng gõ 300ms.
 *
 * Lưu ý: `src/lib/utils.ts` đã có `debounce(fn, wait)` cho hàm thường; hook này
 * là bản dành cho React state (giá trị đã trì hoãn là một phần của render).
 *
 * @example
 * const [keyword, setKeyword] = useState("");
 * const debouncedKeyword = useDebouncedValue(keyword, 300);
 * // dùng `debouncedKeyword` trong query, `keyword` cho value của input
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
