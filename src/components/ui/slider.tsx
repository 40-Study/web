"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange" | "value"
  > {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      disabled,
      ...props
    },
    ref
  ) => {
    const percentage = ((value[0] - min) / (max - min)) * 100;

    return (
      <div className={cn("relative w-full", className)}>
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={value[0]}
          disabled={disabled}
          onChange={(e) => onValueChange([Number(e.target.value)])}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            "relative h-2 w-full cursor-pointer overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
            disabled && "cursor-not-allowed opacity-50"
          )}
          onClick={(e) => {
            if (disabled) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const newPercentage = (x / rect.width) * 100;
            const newValue = min + (newPercentage / 100) * (max - min);
            const steppedValue = Math.round(newValue / step) * step;
            onValueChange([Math.min(max, Math.max(min, steppedValue))]);
          }}
        >
          <div
            className="absolute h-full bg-primary-600 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-primary-600 bg-white shadow transition-all cursor-pointer",
            disabled && "cursor-not-allowed"
          )}
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
