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
}>({ open: false, onOpenChange: () => {} });

export function Dialog({ open, onOpenChange, children }: DialogProps) {
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

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogContent({
  children,
  className,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  const { onOpenChange } = React.useContext(DialogContext);

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
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-xl",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4",
          "duration-200",
          className
        )}
        {...props}
      >
        {showCloseButton && (
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function DialogTitle({ children, className, ...props }: DialogTitleProps) {
  return (
    <h2
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
