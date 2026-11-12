"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { isTypeaheadKey } from "./select-navigation";
import { useSelectListbox, type SelectListboxState } from "./use-select-listbox";

interface SelectContextValue extends SelectListboxState {
  value: string;
  /**
   * Nhãn hiển thị (children của SelectItem) theo từng value — đây là component Select tự
   * viết (không phải Radix), nên SelectValue không tự "biết" nhãn tương ứng với value đang
   * chọn trừ khi mỗi SelectItem tự đăng ký nó vào đây (P3 QA 260927 teacher: trước bản vá
   * này SelectValue chỉ in thẳng `value` thô — "all", "MIXED"... — thay vì nhãn tiếng Việt).
   */
  labels: Record<string, React.ReactNode>;
  registerLabel: (itemValue: string, label: React.ReactNode) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

function useSelect() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select provider");
  }
  return context;
}

function assignRef<T>(ref: React.ForwardedRef<T>, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

/**
 * Listbox theo mẫu "collapsible dropdown listbox" của WAI-ARIA APG (UX-C-01): trigger vẫn là <button> nên giữ
 * tên truy cập lấy từ nội dung (nhiều chỗ gọi không có aria-label); khi mở, focus chuyển vào listbox và mục
 * đang tô báo qua aria-activedescendant. Logic bàn phím nằm ở use-select-listbox.ts.
 */
function Select({ value, onValueChange, children }: SelectProps) {
  const listbox = useSelectListbox(value, onValueChange);
  const [labels, setLabels] = React.useState<Record<string, React.ReactNode>>({});

  // Chỉ setState khi nhãn THỰC SỰ đổi — children là object JSX mới mỗi lần render nên nếu so
  // sánh trực tiếp sẽ setState mỗi render, gây vòng lặp render vô hạn.
  const registerLabel = React.useCallback((itemValue: string, label: React.ReactNode) => {
    setLabels((prev) => (prev[itemValue] === label ? prev : { ...prev, [itemValue]: label }));
  }, []);

  return (
    <SelectContext.Provider value={{ ...listbox, value, labels, registerLabel }}>
      <div ref={listbox.rootRef} className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, id, onClick, onKeyDown, onMouseDown, ...props }, ref) => {
    const { open, openList, closeList, listboxId, triggerId, setTriggerId, triggerRef } = useSelect();
    const resolvedId = id ?? triggerId;

    // Chỗ gọi có thể tự đặt id (cho <Label htmlFor>); listbox dùng id này cho aria-labelledby.
    React.useEffect(() => {
      if (id) setTriggerId(id);
    }, [id, setTriggerId]);

    return (
      <button
        {...props}
        ref={(node) => {
          triggerRef.current = node;
          assignRef(ref, node);
        }}
        id={resolvedId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background transition-colors duration-150 hover:border-muted-foreground/60 focus:outline-none focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-input",
          className
        )}
        // Đang mở mà bấm lại trigger: giữ focus trong listbox để không bị đóng hai lần (blur rồi click).
        onMouseDown={(event) => {
          onMouseDown?.(event);
          if (open) event.preventDefault();
        }}
        onClick={(event) => {
          onClick?.(event);
          if (open) closeList(true);
          else openList("selected");
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || open) return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openList("selected");
          } else if (isTypeaheadKey(event) && event.key !== " ") {
            event.preventDefault();
            openList("selected", event.key);
          }
        }}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")}
        />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

interface SelectValueProps {
  placeholder?: string;
}

function SelectValue({ placeholder }: SelectValueProps) {
  const { value, labels } = useSelect();
  // P3 QA 260927 teacher: value rỗng ("") phải rơi về placeholder (dùng "||", không phải "??"
  // — "" không phải null/undefined nên "??" sẽ dừng lại ở chuỗi rỗng, làm trigger trống trơn).
  // value có giá trị: tra nhãn tiếng Việt đã đăng ký (SelectItem); nếu SelectItem chưa kịp
  // đăng ký (render đầu tiên) thì tạm rơi về value thô, còn hơn trống trơn.
  if (!value) return <span>{placeholder}</span>;
  return <span>{labels[value] ?? value}</span>;
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, listboxId, triggerId, activeValue, optionId, listboxRef, rootRef, closeList, handleListKeyDown } =
      useSelect();

    // P3 QA 260927 teacher: KHÔNG unmount (return null) khi đóng nữa — SelectItem con chỉ đăng
    // ký nhãn (registerLabel) qua useEffect lúc mount; unmount hoàn toàn khi đóng khiến
    // SelectValue không biết nhãn của value đang chọn cho tới khi người dùng mở dropdown ít
    // nhất 1 lần (trigger hiện raw value hoặc placeholder sai cho tới lúc đó). Ẩn bằng "hidden"
    // (display:none) thay vì unmount để SelectItem luôn đăng ký nhãn ngay từ lần render đầu.
    return (
      <div
        {...props}
        ref={(node) => {
          listboxRef.current = node;
          assignRef(ref, node);
        }}
        id={listboxId}
        role="listbox"
        tabIndex={-1}
        aria-labelledby={triggerId}
        aria-activedescendant={open && activeValue !== null ? optionId(activeValue) : undefined}
        onKeyDown={handleListKeyDown}
        // Focus rời khỏi cả khối Select (Tab bằng chuột, bấm chỗ khác) thì đóng, không kéo focus về.
        onBlur={(event) => {
          if (open && !rootRef.current?.contains(event.relatedTarget as Node | null)) closeList(false);
        }}
        className={cn(
          "absolute z-50 mt-1 min-w-[8rem] w-full overflow-hidden rounded-lg border bg-card text-foreground shadow-raised outline-none animate-in fade-in-0 zoom-in-95",
          !open && "hidden",
          className
        )}
      >
        <div className="p-1">{children}</div>
      </div>
    );
  }
);
SelectContent.displayName = "SelectContent";

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value: itemValue, ...props }, ref) => {
    const { value, activeValue, setActiveValue, optionId, choose, registerLabel } = useSelect();
    const isSelected = value === itemValue;
    const isActive = activeValue === itemValue;

    // P3 QA 260927 teacher: đăng ký nhãn hiển thị (children) cho value này để SelectValue tra
    // được — chỉ đăng ký khi children là chuỗi/số đơn giản (đủ cho mọi Select đang dùng trong
    // app), tránh đăng ký node JSX phức tạp không so sánh được bằng "===" (registerLabel đã tự
    // chặn setState thừa khi giá trị KHÔNG đổi, nhưng so sánh "===" trên object JSX luôn false).
    React.useEffect(() => {
      if (typeof children === "string" || typeof children === "number") {
        registerLabel(itemValue, children);
      }
    }, [itemValue, children, registerLabel]);

    return (
      <div
        {...props}
        ref={ref}
        id={optionId(itemValue)}
        role="option"
        aria-selected={isSelected}
        data-value={itemValue}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none",
          isSelected && "font-medium",
          isActive && "bg-accent text-accent-foreground",
          className
        )}
        // Chặn mousedown để focus ở lại listbox; nếu không, listbox blur và đóng trước khi click kịp chọn.
        onMouseDown={(event) => event.preventDefault()}
        onMouseMove={() => {
          if (!isActive) setActiveValue(itemValue);
        }}
        onClick={() => choose(itemValue)}
      >
        {isSelected && (
          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
        {children}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
