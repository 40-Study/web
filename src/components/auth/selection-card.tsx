"use client";

import { cn } from "@/lib/utils";

interface SelectionCardProps {
  selected?: boolean;
  onClick?: () => void;
  avatar: React.ReactNode;
  title: string;
  subtitle: string;
  className?: string;
  avatarClassName?: string;
  ariaLabel?: string;
}

export function SelectionCard({
  selected,
  onClick,
  avatar,
  title,
  subtitle,
  className,
  avatarClassName,
  ariaLabel,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel ?? title}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-muted-foreground hover:bg-muted",
        className
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
          selected
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
          avatarClassName
        )}
      >
        {avatar}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </button>
  );
}
