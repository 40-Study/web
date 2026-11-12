import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap text-[15px] font-medium ring-offset-background transition-all duration-200 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    {
        variants: {
            variant: {
                // Primary: nền --primary (blue-600, trắng 5.17:1); hover blue-700 (light) / blue-300 (dark)
                default: "bg-primary text-primary-foreground hover:bg-primary-700 dark:hover:bg-primary-300 hover:shadow-card rounded-lg shadow-xs",
                // Destructive
                destructive: "bg-red-600 text-white hover:bg-red-700 hover:shadow-card rounded-lg",
                // Hành động xoá trong DANH SÁCH: giữ tín hiệu đỏ nhưng không lấn át nút chính.
                // Đỏ đặc chỉ dành cho nút xác nhận cuối trong hộp thoại xoá.
                destructiveGhost: "text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300",
                // Outline: White with border
                outline: "border border-border bg-card hover:bg-muted/50 text-foreground rounded-lg shadow-xs dark:bg-transparent",
                // Secondary: Light blue
                secondary: "bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700",
                // Ghost
                ghost: "hover:bg-muted text-foreground rounded-lg",
                // Link
                link: "text-primary-600 underline-offset-4 hover:underline dark:text-primary-400",
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

type SlotProps = React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode };

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
    if (typeof ref === "function") ref(value);
    else if (ref) (ref as React.MutableRefObject<T | null>).current = value;
}

/** Slot cuc bo: nhan ban phan tu con duy nhat, gop className, style, handler va ref. */
const Slot = React.forwardRef<HTMLElement, SlotProps>(({ children, ...slotProps }, forwardedRef) => {
    const child = React.Children.only(children);
    if (!React.isValidElement<Record<string, unknown>>(child)) {
        throw new Error("Button asChild requires exactly one React element child");
    }
    const childProps = child.props;
    const merged: Record<string, unknown> = { ...slotProps, ...childProps };
    // Handler: chay handler cua con truoc, roi toi handler cua Button.
    for (const key of Object.keys(slotProps)) {
        const slotVal = (slotProps as Record<string, unknown>)[key];
        const childVal = childProps[key];
        if (/^on[A-Z]/.test(key) && typeof slotVal === "function" && typeof childVal === "function") {
            merged[key] = (...args: unknown[]) => {
                (childVal as (...a: unknown[]) => void)(...args);
                (slotVal as (...a: unknown[]) => void)(...args);
            };
        }
    }
    merged.className = cn(slotProps.className, childProps.className as string | undefined);
    if (slotProps.style || childProps.style) {
        merged.style = { ...slotProps.style, ...(childProps.style as React.CSSProperties | undefined) };
    }
    const childRef = (child as unknown as { ref?: React.Ref<HTMLElement> }).ref;
    // Chi gan ref khi that su co: Button dung trong Server Component khong duoc truyen ref
    // (ham) xuong Client Component con nhu <Link>.
    if (forwardedRef || childRef) {
        merged.ref = (node: HTMLElement | null) => {
            assignRef(forwardedRef, node);
            assignRef(childRef, node);
        };
    }
    return React.cloneElement(child, merged);
});
Slot.displayName = "Slot";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    isLoading?: boolean;
    loadingText?: string;
}

/**
 * UX-A-09 / UX-C-07: nút size="icon" chỉ có biểu tượng nên trình đọc màn hình không có gì để đọc nếu thiếu
 * aria-label. Không ép bằng kiểu TypeScript vì sẽ làm hỏng build ở các chỗ gọi cũ; cảnh báo khi dev để lộ ra.
 * Chạy ngay trong render (không dùng effect) vì Button cũng được dùng trong Server Component.
 */
function warnIfIconButtonUnnamed(size: ButtonProps["size"], props: React.HTMLAttributes<HTMLElement>) {
    if (process.env.NODE_ENV === "production" || size !== "icon") return;
    if (props["aria-label"] || props["aria-labelledby"] || props.title) return;
    console.warn('[Button] Nút size="icon" thiếu aria-label: trình đọc màn hình sẽ không biết nút này làm gì.');
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, isLoading = false, loadingText, children, disabled, ...props }, ref) => {
        // asChild: tên có thể đặt trên phần tử con (vd. <Link aria-label>), nên gộp props của con vào khi kiểm.
        const childProps = asChild && React.isValidElement<React.HTMLAttributes<HTMLElement>>(children) ? children.props : {};
        warnIfIconButtonUnnamed(size, { ...props, ...childProps });
        if (asChild) {
            // Slot: ap class/props len chinh phan tu con (vd. <Link>) thay vi boc them the.
            // isLoading/loadingText khong ap dung (khong the chen spinner vao phan tu con).
            return (
                <Slot
                    className={cn(buttonVariants({ variant, size, className }))}
                    ref={ref as React.Ref<HTMLElement>}
                    aria-disabled={disabled || isLoading || undefined}
                    {...(props as React.HTMLAttributes<HTMLElement>)}
                >
                    {children}
                </Slot>
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
