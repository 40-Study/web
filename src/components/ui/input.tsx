import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, helperText, id, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
        const generatedId = React.useId();
        const inputId = id || generatedId;
        const errorId = `${inputId}-error`;
        const helperId = `${inputId}-helper`;

        // Build aria-describedby from error, helper, and any passed value
        const describedByIds = [
            error ? errorId : null,
            helperText && !error ? helperId : null,
            ariaDescribedBy,
        ].filter(Boolean).join(" ") || undefined;

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="mb-2 block text-sm font-medium text-foreground"
                    >
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    id={inputId}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-destructive focus-visible:ring-destructive",
                        className
                    )}
                    ref={ref}
                    aria-invalid={error ? "true" : undefined}
                    aria-describedby={describedByIds}
                    {...props}
                />
                {error && (
                    <p
                        id={errorId}
                        className="mt-1 text-sm text-destructive"
                        role="alert"
                        aria-live="polite"
                    >
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p
                        id={helperId}
                        className="mt-1 text-sm text-muted-foreground"
                    >
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
