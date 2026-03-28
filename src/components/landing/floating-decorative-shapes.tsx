"use client";

import { cn } from "@/lib/utils";

interface FloatingShape {
  size: string;
  position: string;
  color: string;
  animation: string;
  /** Optional border-only style */
  borderOnly?: boolean;
  rounded?: string;
  rotate?: string;
}

const SHAPES: FloatingShape[] = [
  // Squares
  {
    size: "w-8 h-8",
    position: "top-[15%] left-[8%]",
    color: "border-primary-300/30",
    animation: "animate-[float_8s_ease-in-out_infinite]",
    borderOnly: true,
    rounded: "rounded-lg",
    rotate: "rotate-12",
  },
  {
    size: "w-6 h-6",
    position: "top-[40%] right-[5%]",
    color: "border-secondary-400/25",
    animation: "animate-[float_10s_ease-in-out_infinite_1s]",
    borderOnly: true,
    rounded: "rounded-md",
    rotate: "-rotate-12",
  },
  {
    size: "w-10 h-10",
    position: "bottom-[20%] left-[4%]",
    color: "border-primary-400/20",
    animation: "animate-[float_12s_ease-in-out_infinite_2s]",
    borderOnly: true,
    rounded: "rounded-xl",
    rotate: "rotate-45",
  },
  // Dots
  {
    size: "w-3 h-3",
    position: "top-[25%] right-[12%]",
    color: "bg-primary-400/20",
    animation: "animate-[float_7s_ease-in-out_infinite_0.5s]",
    rounded: "rounded-full",
  },
  {
    size: "w-2 h-2",
    position: "top-[60%] left-[10%]",
    color: "bg-secondary-400/15",
    animation: "animate-[float_9s_ease-in-out_infinite_1.5s]",
    rounded: "rounded-full",
  },
  {
    size: "w-4 h-4",
    position: "bottom-[35%] right-[8%]",
    color: "bg-primary-300/15",
    animation: "animate-[float_11s_ease-in-out_infinite_3s]",
    rounded: "rounded-full",
  },
  // Larger accent square
  {
    size: "w-12 h-12",
    position: "top-[70%] right-[15%]",
    color: "border-primary-200/15",
    animation: "animate-[float_14s_ease-in-out_infinite_2.5s]",
    borderOnly: true,
    rounded: "rounded-2xl",
    rotate: "rotate-[30deg]",
  },
];

/**
 * Floating decorative shapes for visual interest.
 * Pure CSS animations — no JS, no layout thrash, GPU-accelerated.
 */
export function FloatingDecorativeShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
      {SHAPES.map((shape, i) => (
        <div
          key={i}
          className={cn(
            "absolute",
            shape.size,
            shape.position,
            shape.borderOnly ? `border-2 ${shape.color}` : shape.color,
            shape.animation,
            shape.rounded,
            shape.rotate
          )}
        />
      ))}
    </div>
  );
}
