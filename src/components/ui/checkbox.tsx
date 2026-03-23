"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
      props.onChange?.(e);
    };

    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            "w-4 h-4 border rounded flex items-center justify-center transition-colors",
            "border-gray-300 bg-white",
            "peer-checked:border-primary-600 peer-checked:bg-primary-600",
            "peer-focus:ring-2 peer-focus:ring-primary-200",
            "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
            className
          )}
        >
          {checked && <Check className="w-3 h-3 text-white" />}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
