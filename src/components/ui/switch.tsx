"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
          checked ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </label>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
