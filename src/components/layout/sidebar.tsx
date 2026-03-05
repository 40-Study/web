"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores";

interface SidebarProps {
    className?: string;
    children?: React.ReactNode;
}

interface SidebarItemProps {
    href: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    isActive?: boolean;
}

export function Sidebar({ className, children }: SidebarProps) {
    const { isCollapsed, toggle } = useSidebarStore();

    return (
        <aside
            className={cn(
                "flex h-screen flex-col border-r bg-background transition-all duration-300",
                isCollapsed ? "w-16" : "w-64",
                className
            )}
        >
            <div className="flex h-16 items-center justify-between border-b px-4">
                {!isCollapsed && (
                    <span className="text-lg font-semibold">Menu</span>
                )}
                <button
                    onClick={toggle}
                    className="rounded-md p-2 hover:bg-muted"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <svg
                        className={cn(
                            "h-4 w-4 transition-transform",
                            isCollapsed && "rotate-180"
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
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
            <nav className="flex-1 space-y-1 p-2">{children}</nav>
        </aside>
    );
}

export function SidebarItem({ href, icon, children, isActive }: SidebarItemProps) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                    ? "bg-primary-100 text-primary-700"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <span className="truncate">{children}</span>
        </Link>
    );
}
