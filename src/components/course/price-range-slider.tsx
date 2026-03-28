"use client";

/**
 * PriceRangeSlider - dual-handle range slider for min/max price filtering
 * Uses two overlapping range inputs for simplicity and accessibility
 */

import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  className?: string;
}

/** Format a price value as VND (abbreviated) */
function formatPrice(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return value === 0 ? "Miễn phí" : `${value}`;
}

export function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  step = 50000,
  className,
}: PriceRangeSliderProps) {
  const [minVal, maxVal] = value;

  // Percentage positions for track highlight
  const minPercent = ((minVal - min) / (max - min)) * 100;
  const maxPercent = ((maxVal - min) / (max - min)) * 100;

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMin = Math.min(Number(e.target.value), maxVal - step);
      onChange([newMin, maxVal]);
    },
    [maxVal, onChange, step]
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMax = Math.max(Number(e.target.value), minVal + step);
      onChange([minVal, newMax]);
    },
    [minVal, onChange, step]
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Price labels */}
      <div className="flex justify-between text-xs font-medium text-gray-600">
        <span>{formatPrice(minVal)}</span>
        <span>{formatPrice(maxVal)}</span>
      </div>

      {/* Dual-range track */}
      <div className="relative h-5 flex items-center">
        {/* Background track */}
        <div className="absolute w-full h-1.5 rounded-full bg-gray-200" />

        {/* Active range highlight */}
        <div
          className="absolute h-1.5 rounded-full bg-primary-500"
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
        />

        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer price-range-thumb"
          aria-label="Giá tối thiểu"
        />

        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer price-range-thumb"
          aria-label="Giá tối đa"
        />
      </div>

      {/* Min/max boundary labels */}
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{formatPrice(min)}</span>
        <span>{formatPrice(max)}</span>
      </div>
    </div>
  );
}
