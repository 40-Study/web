"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, type LucideIcon } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { filterByQuery } from "@/lib/text-search";
import { cn } from "@/lib/utils";

export interface CommandPaletteItem {
  label: string;
  href: string;
  description?: string;
  keywords?: readonly string[];
  icon?: LucideIcon;
}

interface CommandPaletteProps {
  /** Mục người dùng hiện tại ĐƯỢC THẤY (đã lọc quyền ở layout), lấy thẳng từ menu của khu. */
  items: readonly CommandPaletteItem[];
  /** Tên khu cho tiêu đề đọc màn hình, vd. "khu quản trị". */
  areaLabel: string;
}

/**
 * Bảng lệnh Ctrl+K / Cmd+K tìm CHỨC NĂNG trong khu /admin hoặc /org (không tìm dữ liệu).
 * Không dùng lại GlobalSearch: component đó gắn cứng tìm khoá học qua API và là dropdown, không phải dialog.
 * Theo mẫu combobox của WAI-ARIA: focus luôn ở ô nhập, mục đang chọn báo qua aria-activedescendant.
 */
export function CommandPalette({ items, areaLabel }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl K");
  const listboxId = useId();
  const optionIdPrefix = useId();
  const results = useMemo(() => filterByQuery(items, query), [items, query]);
  const optionId = (index: number) => `${optionIdPrefix}-option-${index}`;

  // Tự trả focus khi đóng: effect trả focus của Dialog chạy SAU effect focus-trap của DialogContent (effect con chạy
  // trước cha), nên nó ghi nhớ nhầm ô nhập thay vì phần tử đã mở bảng lệnh.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const openPalette = useCallback(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (open || !returnFocusRef.current) return;
    returnFocusRef.current.focus();
    returnFocusRef.current = null;
  }, [open]);

  useEffect(() => {
    // Đọc navigator sau khi mount để HTML của server và client khớp nhau.
    if (/Mac|iPhone|iPad/i.test(navigator.platform)) setShortcutLabel("⌘ K");
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
      // Chặn hành vi mặc định của trình duyệt (Ctrl+K là ô tìm kiếm của Chrome/Firefox).
      event.preventDefault();
      if (open) {
        setOpen(false);
      } else {
        openPalette();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, openPalette]);

  useEffect(() => {
    if (!open) return;
    // jsdom không có scrollIntoView nên gọi có điều kiện.
    document.getElementById(optionId(activeIndex))?.scrollIntoView?.({ block: "nearest" });
    // optionId chỉ phụ thuộc optionIdPrefix (ổn định suốt vòng đời component).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open]);

  const choose = (item: CommandPaletteItem) => {
    setOpen(false);
    router.push(item.href);
  };

  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = results[activeIndex];
      if (item) choose(item);
    }
  };

  const activeItem = results[activeIndex];

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        aria-haspopup="dialog"
        aria-label={`Tìm chức năng (${shortcutLabel})`}
        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-muted/60 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:w-56 md:px-3"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="hidden flex-1 text-left md:inline">Tìm chức năng...</span>
        <kbd className="hidden h-5 items-center rounded border border-border bg-card px-1.5 text-[10px] leading-none md:inline-flex" aria-hidden="true">
          {shortcutLabel}
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Đặt sát phía trên (không giữa màn) để danh sách dài ra không đẩy ô nhập chạy theo. */}
        <DialogContent showCloseButton={false} className="mt-[10vh] max-w-xl self-start overflow-hidden [&>div]:p-0">
          <DialogTitle className="sr-only">Tìm chức năng trong {areaLabel}</DialogTitle>
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={activeItem ? optionId(activeIndex) : undefined}
              aria-label="Tìm chức năng"
              placeholder="Gõ tên chức năng, vd. rút tiền"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onInputKeyDown}
              autoComplete="off"
              spellCheck={false}
              // 16px trên mobile để iOS không tự phóng to khi focus.
              className="h-12 min-w-0 flex-1 border-none bg-transparent p-0 text-base text-foreground shadow-none outline-none placeholder:text-muted-foreground focus:ring-0 focus-visible:shadow-none sm:text-sm"
            />
            <kbd className="hidden h-5 items-center rounded border border-border px-1.5 text-[10px] leading-none text-muted-foreground sm:inline-flex" aria-hidden="true">
              Esc
            </kbd>
          </div>

          <ul id={listboxId} role="listbox" aria-label="Chức năng" className="max-h-[min(60vh,24rem)] overflow-y-auto p-2 empty:hidden">
            {results.map((item, index) => {
              const isActive = index === activeIndex;
              const Icon = item.icon;
              return (
                <li
                  key={item.href}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => choose(item)}
                  onMouseMove={() => setActiveIndex(index)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                    isActive ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" : "text-foreground"
                  )}
                >
                  {Icon && <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.label}</span>
                    {item.description && <span className="block truncate text-xs text-muted-foreground">{item.description}</span>}
                  </span>
                  {isActive && <CornerDownLeft className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>

          {results.length === 0 && (
            <p role="status" className="px-4 py-8 text-center text-sm text-muted-foreground">
              Không có chức năng nào khớp “{query.trim()}”
            </p>
          )}

          <div className="hidden items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted-foreground sm:flex" aria-hidden="true">
            <span>↑↓ chọn</span>
            <span>Enter mở</span>
            <span>Esc đóng</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
