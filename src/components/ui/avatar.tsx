"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

interface AvatarProps {
  src?: string;
  fallback: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy" | "streak";
  className?: string;
}

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
  offline: "bg-gray-400",
  busy: "bg-red-500",
  streak: "bg-orange-500",
};

export function Avatar({
  src,
  fallback,
  size = "md",
  status,
  className,
}: AvatarProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center overflow-hidden",
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
          <span className="font-medium text-white uppercase">
            {fallback.slice(0, 2)}
          </span>
        )}
      </div>

      {status && (
        <div
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center",
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
