import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
    /** Icon hiển thị trong vòng tròn primary. */
    icon?: LucideIcon;
    title: string;
    description?: React.ReactNode;
    /** Hành động chính, thường là một <Button>. */
    action?: React.ReactNode;
    className?: string;
}

/**
 * Khối trạng thái rỗng dùng chung — căn giữa, icon trong vòng tròn primary-50,
 * tiêu đề, mô tả và (tuỳ chọn) một hành động bên dưới.
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-3 py-12 text-center",
                className
            )}
        >
            {Icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
            )}
            <p className="text-base font-semibold text-foreground">{title}</p>
            {description && (
                <div className="max-w-sm text-sm text-muted-foreground">
                    {description}
                </div>
            )}
            {action && <div className="mt-1">{action}</div>}
        </div>
    );
}
