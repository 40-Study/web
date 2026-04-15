import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap text-[15px] font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                // Primary: Blue button (Educational style)
                default: "bg-primary-600 text-white hover:bg-primary-700 rounded-lg shadow-sm",
                // Destructive
                destructive: "bg-red-600 text-white hover:bg-red-700 rounded-lg",
                // Outline: White with border
                outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm",
                // Secondary: Light blue
                secondary: "bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg",
                // Ghost
                ghost: "hover:bg-slate-100 text-slate-700 rounded-lg",
                // Link
                link: "text-primary-600 underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-5 py-2",
                sm: "h-9 px-4 text-sm",
                lg: "h-12 px-8 text-base",
                icon: "h-10 w-10 rounded-lg",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    isLoading?: boolean;
    loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, isLoading = false, loadingText, children, disabled, ...props }, ref) => {
        if (asChild) {
            return (
                <span className={cn(buttonVariants({ variant, size, className }))}>
                    {children}
                </span>
            );
        }
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {loadingText || children}
                    </>
                ) : (
                    children
                )}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
