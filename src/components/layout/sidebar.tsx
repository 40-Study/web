"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores";

interface SidebarProps {
    className?: string;
    children?: React.ReactNode;
    /** Accessible label for the sidebar navigation */
    "aria-label"?: string;
}

interface SidebarItemProps {
    href: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    isActive?: boolean;
}

export function Sidebar({ className, children, "aria-label": ariaLabel = "Thanh điều hướng bên" }: SidebarProps) {
    const { isCollapsed, toggle } = useSidebarStore();

    return (
        <aside
            role="complementary"
            aria-label={ariaLabel}
            className={cn(
                "flex h-screen flex-col border-r bg-background transition-all duration-300 motion-reduce:transition-none",
                isCollapsed ? "w-16" : "w-64",
                className
            )}
        >
            <div className="flex h-16 items-center justify-between border-b px-4">
                {!isCollapsed && (
                    <span className="text-lg font-semibold" id="sidebar-title">Menu</span>
                )}
                <button
                    onClick={toggle}
                    className="rounded-md p-2 hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                    aria-expanded={!isCollapsed}
                    aria-label={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
                >
                    <svg
                        className={cn(
                            "h-4 w-4 transition-transform motion-reduce:transition-none",
                            isCollapsed && "rotate-180"
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                        />
                    </svg>
                </button>
            </div>
            <nav
                className="flex-1 space-y-1 p-2"
                role="navigation"
                aria-label="Menu chính"
            >
                {children}
            </nav>
        </aside>
    );
}

export function SidebarItem({ href, icon, children, isActive }: SidebarItemProps) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 min-h-[44px] text-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                isActive
                    ? "bg-primary-100 text-primary-700"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
        >
            {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
            <span className="truncate">{children}</span>
        </Link>
    );
}
