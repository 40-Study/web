"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    /**
     * The ID of the main content element to skip to
     * @default "main-content"
     */
    targetId?: string;
    /**
     * Text to display in the skip link
     * @default "Skip to main content"
     */
    children?: React.ReactNode;
}

/**
 * SkipLink - Allows keyboard users to skip navigation and jump to main content
 *
 * This component is hidden by default and appears when focused.
 * Place it as the first focusable element in the document.
 *
 * WCAG 2.1 Success Criterion 2.4.1 - Bypass Blocks
 *
 * @example
 * // In layout.tsx
 * <body>
 *   <SkipLink targetId="main-content" />
 *   <Header />
 *   <main id="main-content">...</main>
 * </body>
 */
const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
    ({ targetId = "main-content", children, className, ...props }, ref) => {
        const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            const target = document.getElementById(targetId);
            if (target) {
                // Set tabindex to make the element focusable if it isn't already
                if (!target.hasAttribute("tabindex")) {
                    target.setAttribute("tabindex", "-1");
                }
                target.focus();
                // Scroll into view smoothly
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        };

        return (
            <a
                ref={ref}
                href={`#${targetId}`}
                onClick={handleClick}
                className={cn(
                    // Hidden by default (screen reader only)
                    "sr-only",
                    // Visible on focus
                    "focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]",
                    // Styling when visible
                    "focus:inline-flex focus:items-center focus:justify-center",
                    "focus:px-4 focus:py-2 focus:rounded-md",
                    "focus:bg-primary-600 focus:text-white",
                    "focus:font-medium focus:text-sm",
                    "focus:shadow-lg",
                    // Focus ring
                    "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2",
                    // Animation
                    "focus:animate-in focus:fade-in focus:slide-in-from-top-2",
                    "motion-reduce:focus:animate-none",
                    className
                )}
                {...props}
            >
                {children || "Skip to main content"}
            </a>
        );
    }
);

SkipLink.displayName = "SkipLink";

export { SkipLink };
export type { SkipLinkProps };
