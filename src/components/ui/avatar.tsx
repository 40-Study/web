"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

interface AvatarProps {
  src?: string;
  fallback: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy" | "streak";
  /**
   * Màu của VÒNG TRÒN chữ cái (Q6-T05). `className` chỉ áp lên khung ngoài (vuông) nên truyền `bg-primary-100` qua đó
   * tô ô vuông sau hình tròn thay vì tô chính hình tròn. "soft" = nền nhạt, chữ đậm (danh sách học viên); mặc định "solid".
   */
  tone?: "solid" | "soft";
  className?: string;
}

const tones = {
  solid: "bg-primary-500 text-white",
  soft: "bg-primary-100 text-primary-700",
};

const sizes = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-xl",
};

const imageSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

const statusSizes = {
  xs: "h-2 w-2",
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
  xl: "h-4 w-4",
};

const statusColors = {
  online: "bg-green-500",
  offline: "bg-slate-400",
  busy: "bg-red-500",
  streak: "bg-orange-500",
};

export function Avatar({
  src,
  fallback,
  size = "md",
  status,
  tone = "solid",
  className,
}: AvatarProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center overflow-hidden",
          tones[tone],
          sizes[size]
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={fallback}
            width={imageSizes[size]}
            height={imageSizes[size]}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-medium uppercase">
            {fallback.slice(0, 2)}
          </span>
        )}
      </div>

      {status && (
        <div
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center",
            statusSizes[size],
            status !== "streak" && statusColors[status]
          )}
        >
          {status === "streak" && (
            <Flame className="h-full w-full text-orange-500" />
          )}
        </div>
      )}
    </div>
  );
}
