import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Lớp trên cùng: `role="alertdialog"` lồng trong modal (vd. hộp xác nhận thoát) nếu có, ngược lại là chính container. */
function topLayer(root: HTMLElement): HTMLElement {
  const nested = root.querySelectorAll<HTMLElement>('[role="alertdialog"]');
  return nested[nested.length - 1] ?? root;
}

function focusablesOf(layer: HTMLElement): HTMLElement[] {
  return Array.from(layer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/**
 * Hành vi bàn phím của một modal tự dựng (G-02, QA3 261104): Esc đóng, Tab xoay vòng trong modal,
 * focus vào modal khi mở và trả lại phần tử trước đó khi đóng. Cùng hành vi với `DialogContent`
 * (components/ui/dialog.tsx), tách riêng vì modal đăng nhập có bố cục, nút quay lại và hộp xác nhận
 * thoát riêng nên không bọc được bằng primitive đó.
 *
 * `nestedOpen`: có lớp `role="alertdialog"` đang mở trong container — Tab/focus chỉ xoay trong lớp đó.
 */
export function useModalA11y(
  active: boolean,
  rootRef: RefObject<HTMLElement>,
  onEscape: () => void,
  nestedOpen = false,
) {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  // Ghi nhớ phần tử đang focus lúc mở, trả lại lúc đóng.
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus?.();
  }, [active]);

  // Đưa focus vào lớp trên cùng mỗi khi mở modal hoặc mở/đóng hộp xác nhận.
  useEffect(() => {
    const root = rootRef.current;
    if (!active || !root) return;
    const layer = topLayer(root);
    (focusablesOf(layer)[0] ?? layer).focus();
  }, [active, nestedOpen, rootRef]);

  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onEscapeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const layer = topLayer(root);
      const items = focusablesOf(layer);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (!layer.contains(current)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, rootRef]);
}
