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
  // Phần tử đang focus trước khi mở dialog — trả focus lại đó khi đóng (L-03, UX-B-02).
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const wasOpenRef = React.useRef(false);

  // UX-B-02: phải ghi trigger NGAY TRONG render lúc open vừa chuyển sang true. Ghi trong effect là quá muộn:
  // effect của con (DialogContent đưa focus vào nút đầu tiên) và autoFocus của ô nhập đều chạy trước effect
  // của Dialog, nên effect chỉ còn thấy phần tử BÊN TRONG dialog; đóng dialog thì phần tử đó bị gỡ và focus
  // rơi về <body>. Lúc render, DOM chưa đổi nên document.activeElement vẫn là nút đã mở dialog.
  if (open && !wasOpenRef.current && typeof document !== "undefined") {
    triggerRef.current = document.activeElement as HTMLElement | null;
  }

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      // defaultPrevented: phần tử con đã tự xử lý Esc (vd. Select đang mở chỉ đóng danh sách, không đóng dialog).
      if (e.key === "Escape" && open && !e.defaultPrevented) {
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

  // Trả focus về trigger khi đóng (Esc, Huỷ, nút X, bấm nền) hoặc khi Dialog bị gỡ lúc đang mở. Bỏ qua nếu
  // trigger đã rời DOM (vd. dòng vừa bị xoá) để không gọi focus() vào phần tử tách rời.
  React.useEffect(() => {
    if (!open) return;
    wasOpenRef.current = true;
    return () => {
      wasOpenRef.current = false;
      // Không xoá triggerRef ở đây: StrictMode (dev) chạy cleanup giả rồi chạy lại effect ngay lúc mount,
      // xoá thì lần đóng thật sẽ mất trigger. Lần mở sau tự ghi đè trigger mới trong render.
      const trigger = triggerRef.current;
      if (trigger && trigger !== document.body && trigger.isConnected) trigger.focus();
    };
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

    // Tôn trọng autoFocus của chỗ gọi (focus đã ở trong dialog thì giữ). Nếu chưa, ưu tiên phần tử đầu tiên
    // của NỘI DUNG (vd. ô "Tên chương") thay vì nút X nằm đầu DOM (UX-B-02 phụ); không có thì mới tới nút X.
    if (!node.contains(document.activeElement)) {
      const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const firstContent = focusables.find((el) => !el.hasAttribute("data-dialog-close"));
      (firstContent ?? focusables[0] ?? node).focus();
    }

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
          "relative z-50 w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-3xl shadow-overlay",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4",
          "duration-200",
          className
        )}
        {...props}
      >
        {showCloseButton && (
          <button
            type="button"
            data-dialog-close=""
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Đóng hộp thoại"
          >
            <X className="h-4 w-4 text-slate-500" aria-hidden="true" />
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
      className={cn("font-heading text-lg font-semibold text-slate-900 dark:text-white", className)}
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
      className={cn("text-sm text-slate-500 dark:text-slate-400 mt-1", className)}
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
