"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
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

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [labels, setLabels] = React.useState<Record<string, React.ReactNode>>({});

  // Chỉ setState khi nhãn THỰC SỰ đổi — children là object JSX mới mỗi lần render nên nếu so
  // sánh trực tiếp sẽ setState mỗi render, gây vòng lặp render vô hạn.
  const registerLabel = React.useCallback((itemValue: string, label: React.ReactNode) => {
    setLabels((prev) => (prev[itemValue] === label ? prev : { ...prev, [itemValue]: label }));
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, labels, registerLabel }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useSelect();

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-card px-3 py-2 text-sm ring-offset-background transition-colors duration-150 hover:border-slate-300 focus:outline-none focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:hover:border-slate-600",
          className
        )}
        onClick={() => setOpen(!open)}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            "h-4 w-4 opacity-50 transition-transform",
            open && "rotate-180"
          )}
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
    const { open, setOpen } = useSelect();
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(event.target as Node)
        ) {
          setOpen(false);
        }
      };

      if (open) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [open, setOpen]);

    // P3 QA 260927 teacher: KHÔNG unmount (return null) khi đóng nữa — SelectItem con chỉ đăng
    // ký nhãn (registerLabel) qua useEffect lúc mount; unmount hoàn toàn khi đóng khiến
    // SelectValue không biết nhãn của value đang chọn cho tới khi người dùng mở dropdown ít
    // nhất 1 lần (trigger hiện raw value hoặc placeholder sai cho tới lúc đó). Ẩn bằng "hidden"
    // (display:none) thay vì unmount để SelectItem luôn đăng ký nhãn ngay từ lần render đầu.
    return (
      <div
        ref={contentRef}
        className={cn(
          "absolute z-50 mt-1 min-w-[8rem] w-full overflow-hidden rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-raised animate-in fade-in-0 zoom-in-95",
          !open && "hidden",
          className
        )}
        {...props}
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
    const { value, onValueChange, setOpen, registerLabel } = useSelect();
    const isSelected = value === itemValue;

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
        ref={ref}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          isSelected && "bg-accent",
          className
        )}
        onClick={() => {
          onValueChange(itemValue);
          setOpen(false);
        }}
        {...props}
      >
        {isSelected && (
          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <Check className="h-4 w-4" />
          </span>
        )}
        {children}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
