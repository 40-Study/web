import { useCallback, useEffect, useRef, useState } from "react";

// Cùng ngưỡng với lưới hai cột `xl:` của các trang admin: từ đây form nằm cột phải (ghim sticky), dưới đó nằm SAU danh sách.
const TWO_COLUMN_QUERY = "(min-width: 1280px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * QA6-A01: bấm "Sửa" ở hàng thấp của danh sách dài mở form ở cột phải/cuối trang, ngoài tầm nhìn nên nút trông như
 * hỏng. Gắn `ref` vào form (chỉ có trong DOM khi đang sửa) rồi gọi `reveal()` cùng lúc đặt state sửa: sau khi form
 * render hook cuộn nó vào khung nhìn (hai cột chỉ cuộn khi form đang ngoài khung) và đưa focus vào ô nhập đầu tiên.
 */
export function useRevealForm<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [request, setRequest] = useState(0);

  useEffect(() => {
    const form = ref.current;
    if (request === 0 || !form) return;
    const reduceMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const twoColumn = window.matchMedia(TWO_COLUMN_QUERY).matches;
    // jsdom không có scrollIntoView; trình duyệt thật luôn có.
    form.scrollIntoView?.({ behavior: reduceMotion ? "auto" : "smooth", block: twoColumn ? "nearest" : "start" });
    form.querySelector<HTMLElement>("textarea, input")?.focus({ preventScroll: true });
  }, [request]);

  const reveal = useCallback(() => setRequest((n) => n + 1), []);
  return { ref, reveal };
}
