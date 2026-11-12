"use client";

import * as React from "react";
import { findTypeaheadIndex, getNavigatedIndex, isTypeaheadKey } from "./select-navigation";

/** Sau khoảng nghỉ này, chuỗi gõ để nhảy được xoá để lần gõ sau tìm lại từ đầu. */
const TYPEAHEAD_RESET_MS = 500;

type OpenTarget = "selected" | "first" | "last";

export interface SelectListboxState {
  open: boolean;
  /** Mục đang được tô bằng bàn phím/chuột (aria-activedescendant), khác với mục đã chọn. */
  activeValue: string | null;
  setActiveValue: (value: string) => void;
  listboxId: string;
  triggerId: string;
  setTriggerId: (id: string) => void;
  optionId: (itemValue: string) => string;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
  listboxRef: React.MutableRefObject<HTMLDivElement | null>;
  rootRef: React.MutableRefObject<HTMLDivElement | null>;
  /** Mở danh sách; `typed` là phím chữ vừa gõ trên trigger đang đóng (nhảy thẳng tới mục khớp). */
  openList: (target: OpenTarget, typed?: string) => void;
  closeList: (returnFocus: boolean) => void;
  choose: (itemValue: string) => void;
  handleListKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
}

/**
 * Trạng thái và bàn phím của Select theo mẫu "collapsible dropdown listbox" của WAI-ARIA APG (UX-C-01).
 * Thứ tự mục đọc từ DOM lúc bấm phím (`[role=option]` trong listbox), nên SelectItem không phải đăng ký thứ tự.
 */
export function useSelectListbox(value: string, onValueChange: (value: string) => void): SelectListboxState {
  const [open, setOpen] = React.useState(false);
  const [activeValue, setActiveValue] = React.useState<string | null>(null);
  const baseId = React.useId();
  const [triggerId, setTriggerId] = React.useState(`${baseId}-trigger`);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const listboxRef = React.useRef<HTMLDivElement | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const typedRef = React.useRef("");
  const typedTimerRef = React.useRef<ReturnType<typeof setTimeout>>();

  // value có thể chứa dấu cách (vd. tên khoá học) mà id thì không được có, nên mã hoá.
  const optionId = React.useCallback(
    (itemValue: string) => `${baseId}-option-${encodeURIComponent(itemValue)}`,
    [baseId]
  );
  const getOptions = () =>
    Array.from(listboxRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);

  // Gộp các phím gõ liên tiếp thành một chuỗi rồi tìm mục khớp; trả value của mục đó hoặc null.
  const typeahead = (key: string, fromValue: string | null) => {
    typedRef.current += key;
    clearTimeout(typedTimerRef.current);
    typedTimerRef.current = setTimeout(() => (typedRef.current = ""), TYPEAHEAD_RESET_MS);
    const options = getOptions();
    const current = options.findIndex((option) => option.dataset.value === fromValue);
    const index = findTypeaheadIndex(options.map((option) => option.textContent ?? ""), typedRef.current, current);
    return index >= 0 ? options[index].dataset.value ?? null : null;
  };

  const openList = (target: OpenTarget, typed?: string) => {
    const values = getOptions().map((option) => option.dataset.value ?? "");
    const hasValue = values.includes(value);
    let next = typed ? typeahead(typed, hasValue ? value : null) : null;
    if (next === null) {
      if (target === "last") next = values[values.length - 1] ?? null;
      else if (target === "selected" && hasValue) next = value;
      else next = values[0] ?? null;
    }
    setActiveValue(next);
    setOpen(true);
  };

  const closeList = (returnFocus: boolean) => {
    setOpen(false);
    typedRef.current = "";
    if (returnFocus) triggerRef.current?.focus();
  };

  const choose = (itemValue: string) => {
    if (itemValue !== value) onValueChange(itemValue);
    closeList(true);
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const options = getOptions();
    const current = options.findIndex((option) => option.dataset.value === activeValue);
    const navigated = getNavigatedIndex(event.key, current, options.length);
    if (navigated !== null) {
      event.preventDefault();
      setActiveValue(options[navigated].dataset.value ?? "");
      return;
    }
    // Dấu cách giữa lúc đang gõ ("tat ca") là một phần chuỗi tìm, không phải lệnh chọn.
    const isSpaceSelect = event.key === " " && typedRef.current === "";
    if (event.key === "Enter" || isSpaceSelect) {
      event.preventDefault();
      if (activeValue !== null) choose(activeValue);
      else closeList(true);
    } else if (event.key === "Escape") {
      // preventDefault để Dialog bao ngoài (nghe Escape ở document) biết phím đã được xử lý và không tự đóng.
      event.preventDefault();
      event.stopPropagation();
      closeList(true);
    } else if (event.key === "Tab") {
      // Không preventDefault: trả focus về trigger trước, trình duyệt sẽ Tab tiếp từ trigger sang ô kế bên.
      closeList(true);
    } else if (isTypeaheadKey(event)) {
      event.preventDefault();
      const match = typeahead(event.key, activeValue);
      if (match !== null) setActiveValue(match);
    }
  };

  // Mở thì đưa focus vào listbox (phải đợi commit vì lúc đóng listbox đang display:none, không focus được).
  React.useEffect(() => {
    if (open) listboxRef.current?.focus({ preventScroll: true });
  }, [open]);

  React.useEffect(() => {
    if (!open || activeValue === null) return;
    // jsdom không có scrollIntoView nên gọi có điều kiện.
    document.getElementById(optionId(activeValue))?.scrollIntoView?.({ block: "nearest" });
  }, [open, activeValue, optionId]);

  // Bấm chuột ra ngoài thì đóng. Kiểm theo cả khối Select (không chỉ listbox) để bấm lại trigger không bị
  // đóng ở mousedown rồi mở lại ở click.
  React.useEffect(() => {
    if (!open) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  React.useEffect(() => () => clearTimeout(typedTimerRef.current), []);

  return {
    open, activeValue, setActiveValue, listboxId: `${baseId}-listbox`, triggerId, setTriggerId, optionId,
    triggerRef, listboxRef, rootRef, openList, closeList, choose, handleListKeyDown,
  };
}
