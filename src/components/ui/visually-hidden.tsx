"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
    /**
     * Content to be hidden visually but accessible to screen readers
     */
    children: React.ReactNode;
    /**
     * When true, the element becomes visible (useful for focus states)
     */
    focusable?: boolean;
}

/**
 * VisuallyHidden - Hides content visually while keeping it accessible to screen readers
 *
 * Use cases:
 * - Icon-only buttons that need accessible labels
 * - Additional context for screen reader users
 * - Skip links that appear on focus
 *
 * @example
 * <button>
 *   <XIcon />
 *   <VisuallyHidden>Close dialog</VisuallyHidden>
 * </button>
 */
const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
    ({ children, className, focusable = false, ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={cn(
                    // Screen reader only styles
                    "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
                    "[clip:rect(0,0,0,0)]",
                    // When focusable, show on focus
                    focusable && "focus:static focus:w-auto focus:h-auto focus:p-0 focus:m-0 focus:overflow-visible focus:whitespace-normal focus:[clip:auto]",
                    className
                )}
                {...props}
            >
                {children}
            </span>
        );
    }
);

VisuallyHidden.displayName = "VisuallyHidden";

export { VisuallyHidden };
export type { VisuallyHiddenProps };
