"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarStore, useAuthStore } from "@/stores";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    BookOpen,
    Users,
    ClipboardList,
    BarChart3,
    Wallet,
    ChevronRight,
    ChevronLeft
} from "lucide-react";

interface TeacherSidebarProps {
    className?: string;
}

const menuItems = [
    { label: "Lịch giảng dạy", href: "/teacher/schedule", icon: Calendar },
    { label: "Quản lý khóa học", href: "/teacher/courses", icon: BookOpen },
    { label: "Quản lý học sinh", href: "/teacher/students", icon: Users },
    { label: "Quản lý bài tập", href: "/teacher/assignments", icon: ClipboardList },
    { label: "Thống kê", href: "/teacher/analytics", icon: BarChart3 },
    { label: "Ví", href: "/teacher/wallet", icon: Wallet },
];

export function TeacherSidebar({ className }: TeacherSidebarProps) {
    const { isCollapsed, toggle } = useSidebarStore();
    const { user } = useAuthStore();
    const pathname = usePathname();

    return (
        <aside
            role="complementary"
            aria-label="Thanh điều hướng giáo viên"
            className={cn(
                "hidden lg:flex h-[calc(100vh-4rem)] flex-col border-r bg-background transition-all duration-300 motion-reduce:transition-none sticky top-16",
                isCollapsed ? "w-16" : "w-64",
                className
            )}
        >
            <nav
                className="flex-1 space-y-1 p-2 overflow-y-auto"
                role="navigation"
                aria-label="Menu giáo viên"
            >
                {menuItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/teacher/schedule" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 min-h-[44px] text-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                                isActive
                                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                isCollapsed && "justify-center px-0"
                            )}
                            aria-current={isActive ? "page" : undefined}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile at Bottom */}
            <div className="mt-auto border-t p-3 shrink-0">
                <div className={cn(
                    "flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors",
                    isCollapsed && "justify-center"
                )}>
                    <Avatar
                        src={user?.avatar}
                        fallback={user?.name || "GV"}
                        size="sm"
                    />
                    {!isCollapsed && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate">
                                {user?.name || "Giáo viên"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                                Giảng viên
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
