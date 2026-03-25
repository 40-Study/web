"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  variant?: "default" | "xp" | "streak" | "course" | "level";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const variants = {
  default: "bg-primary-500",
  xp: "bg-green-500",
  streak: "bg-orange-500",
  course: "bg-primary-500",
  level: "bg-primary-600",
};

const sizes = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4 rounded-full",
};

export function ProgressBar({
  value,
  variant = "default",
  size = "md",
  showLabel = false,
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden",
          sizes[size]
        )}
      >
        <div
          className={cn(
            variants[variant],
            sizes[size],
            "transition-all duration-500 ease-out"
          )}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground mt-1">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}
