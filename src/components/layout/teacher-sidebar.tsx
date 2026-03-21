"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarStore, useAuthStore } from "@/stores";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    LayoutDashboard,
    BookOpen,
    Users2,
    ClipboardList,
    FileCheck,
    GraduationCap,
    BarChart3,
    Settings,
    ChevronRight,
    ChevronLeft
} from "lucide-react";

interface TeacherSidebarProps {
    className?: string;
}

const menuItems = [
    { label: "Tổng quan", href: "/teacher/dashboard", icon: LayoutDashboard },
    { label: "Khoá học", href: "/teacher/courses", icon: BookOpen },
    { label: "Lớp học", href: "/teacher/classes", icon: Users2 },
    { label: "Bài tập", href: "/teacher/assignments", icon: ClipboardList },
    { label: "Bài kiểm tra", href: "/teacher/exams", icon: FileCheck },
    { label: "Học sinh", href: "/teacher/students", icon: GraduationCap },
    { label: "Thống kê", href: "/teacher/analytics", icon: BarChart3 },
    { label: "Cài đặt", href: "/teacher/settings", icon: Settings },
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
                "hidden lg:flex h-screen flex-col border-r bg-background transition-all duration-300 motion-reduce:transition-none sticky top-0",
                isCollapsed ? "w-16" : "w-64",
                className
            )}
        >
            <div className="flex h-16 items-center justify-between border-b px-4 shrink-0">
                {!isCollapsed && (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar
                            src={user?.avatar}
                            fallback={user?.name || "GV"}
                            size="sm"
                        />
                        <div className="flex flex-col truncate">
                            <span className="text-sm font-semibold truncate">
                                {user?.name || "Giáo viên"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                                Bảng điều khiển
                            </span>
                        </div>
                    </div>
                )}
                <button
                    onClick={toggle}
                    className="rounded-md p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 shrink-0 ml-auto"
                    aria-expanded={!isCollapsed}
                    aria-label={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    )}
                </button>
            </div>

            <nav
                className="flex-1 space-y-1 p-2 overflow-y-auto"
                role="navigation"
                aria-label="Menu giáo viên"
            >
                {menuItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href));

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
        </aside>
    );
}
