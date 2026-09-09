"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  showCloseButton?: boolean;
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface DialogDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  hasTitle: boolean;
  registerTitle: () => void;
}>({ open: false, onOpenChange: () => {}, titleId: "", hasTitle: false, registerTitle: () => {} });

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  // Id ổn định cho mỗi instance Dialog — DialogContent gắn aria-labelledby trỏ
  // tới id này, DialogTitle gắn id này lên chính nó (M-11).
  const titleId = React.useId();
  // aria-labelledby chỉ nên trỏ tới id thật sự tồn tại trong DOM — Dialog
  // không phải lúc nào cũng có DialogTitle (L-03), nên theo dõi xem có hay không.
  const [hasTitle, setHasTitle] = React.useState(false);
  const registerTitle = React.useCallback(() => setHasTitle(true), []);
  // Phần tử đang focus trước khi mở dialog — trả focus lại đó khi đóng (L-03).
  const triggerRef = React.useRef<HTMLElement | null>(null);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  // Prevent body scroll when dialog is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Ghi nhớ trigger lúc mở, trả focus lại lúc đóng (L-03).
  React.useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement | null;
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ open, onOpenChange, titleId, hasTitle, registerTitle }}>
      {children}
    </DialogContext.Provider>
  );
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DialogContent({
  children,
  className,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  const { onOpenChange, titleId, hasTitle } = React.useContext(DialogContext);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Focus trap (M-11 / WCAG 2.4.3): đưa focus vào dialog khi mở, giữ Tab luôn
  // xoay vòng bên trong dialog thay vì thoát ra nội dung phía sau.
  React.useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const focusables = node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusables[0] ?? node).focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    node.addEventListener("keydown", handleKeyDown);
    return () => node.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Check if flex layout is requested to pass it to inner wrapper
  const hasFlex = className?.includes("flex");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasTitle ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-50 w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4",
          "duration-200",
          className
        )}
        {...props}
      >
        {showCloseButton && (
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
            aria-label="Đóng hộp thoại"
          >
            <X className="h-4 w-4 text-gray-500" aria-hidden="true" />
          </button>
        )}
        <div className={cn("p-6", hasFlex && "flex flex-col flex-1 min-h-0")}>{children}</div>
      </div>
    </div>
  );
}

export function DialogTitle({ children, className, ...props }: DialogTitleProps) {
  const { titleId, registerTitle } = React.useContext(DialogContext);
  // Báo cho Dialog biết đã có tiêu đề thật trong DOM (L-03) — chạy trong effect
  // vì đây là side-effect ghi vào context của component cha, không phải render.
  React.useEffect(() => {
    registerTitle();
  }, [registerTitle]);
  return (
    <h2
      id={titleId}
      className={cn("text-lg font-semibold text-gray-900 dark:text-white", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

export function DialogDescription({
  children,
  className,
  ...props
}: DialogDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-gray-500 dark:text-gray-400 mt-1", className)}
      {...props}
    >
      {children}
    </p>
  );
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DialogHeader({ children, className, ...props }: DialogHeaderProps) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DialogFooter({ children, className, ...props }: DialogFooterProps) {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}
