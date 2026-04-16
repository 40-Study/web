"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopover() {
  const context = React.useContext(PopoverContext);
  if (!context) throw new Error("usePopover must be used within Popover");
  return context;
}

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement>(null);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
}

interface PopoverTriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
}

export function PopoverTrigger({ children, asChild }: PopoverTriggerProps) {
  const { open, setOpen, triggerRef } = usePopover();

  const handleClick = (e: React.MouseEvent) => {
    if (children.props.onClick) {
      children.props.onClick(e);
    }
    setOpen(!open);
  };

  if (asChild) {
    return (
      <span
        ref={triggerRef as React.RefObject<HTMLSpanElement>}
        onClick={handleClick}
        style={{ display: "inline-block" }}
      >
        {children}
      </span>
    );
  }

  return (
    <button ref={triggerRef as React.RefObject<HTMLButtonElement>} onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

export function PopoverContent({
  children,
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: PopoverContentProps) {
  const { open, setOpen, triggerRef } = usePopover();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  // Position the popover
  React.useEffect(() => {
    if (open && triggerRef.current && contentRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();

      let left = triggerRect.left;
      if (align === "center") {
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
      } else if (align === "end") {
        left = triggerRect.right - contentRect.width;
      }

      // Keep within viewport
      left = Math.max(8, Math.min(left, window.innerWidth - contentRect.width - 8));
      let top = triggerRect.bottom + sideOffset;

      // If not enough space below, show above
      if (top + contentRect.height > window.innerHeight - 8) {
        top = triggerRect.top - contentRect.height - sideOffset;
      }

      setPosition({ top, left });
    }
  }, [open, align, sideOffset, triggerRef]);

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, setOpen, triggerRef]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        "fixed z-50 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      style={{ top: position.top, left: position.left }}
      {...props}
    >
      {children}
    </div>
  );
}
