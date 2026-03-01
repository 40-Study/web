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
          ? "border-primary-500 bg-primary-50"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
        className
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
          selected
            ? "bg-primary-100 text-primary-600"
            : "bg-gray-100 text-gray-500",
          avatarClassName
        )}
      >
        {avatar}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </button>
  );
}
