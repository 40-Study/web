import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
        secondary:
          "bg-secondary-50 text-secondary-700 dark:bg-secondary-950 dark:text-secondary-300",
        success:
          "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300",
        warning:
          "bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
        destructive:
          "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300",
        outline: "border border-border bg-transparent text-foreground",

        // Gamification variants
        xp: "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-500/30",
        streak:
          "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-500/30",
        level: "bg-primary-600 text-white",
        achievement: "bg-yellow-400 text-yellow-950",

        // League badges
        bronze: "bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-900/50 dark:text-orange-200 dark:border-orange-800",
        silver: "bg-muted text-foreground border border-input",
        gold: "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-800",
        diamond: "bg-cyan-100 text-cyan-700 border border-cyan-300 dark:bg-cyan-900/50 dark:text-cyan-200 dark:border-cyan-800",
        champion: "bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-800",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

interface BadgeRemoveButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Bắt buộc: nút chỉ có dấu X nên tên truy cập phải nói rõ gỡ cái gì (vd. "Gỡ vai trò Giáo viên của An"). */
  "aria-label": string;
}

/**
 * Nút X gỡ đặt trong Badge (UX-C-05). Vùng bấm 24×24 (WCAG 2.5.8) nhưng margin âm giữ badge cao như cũ,
 * nên đặt vào không làm vỡ hàng; dấu X vẫn nhỏ để không lấn chữ.
 */
export function BadgeRemoveButton({ className, type = "button", ...props }: BadgeRemoveButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "-my-1 -mr-1.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10",
        className
      )}
      {...props}
    >
      <X className="h-3 w-3" aria-hidden="true" />
    </button>
  );
}

export { badgeVariants };
