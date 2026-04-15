import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-neutral-100 text-black dark:bg-neutral-800 dark:text-white",
        secondary:
          "bg-stone-warm text-black dark:bg-neutral-800 dark:text-white",
        success:
          "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300",
        warning:
          "bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
        destructive:
          "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300",
        outline: "border border-neutral-200 bg-transparent text-black dark:border-neutral-700 dark:text-white",

        // Gamification variants
        xp: "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/50 dark:text-green-300",
        streak:
          "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/50 dark:text-orange-300",
        level: "bg-primary-500 text-white",
        achievement: "bg-yellow-400 text-white",

        // League badges
        bronze: "bg-orange-100 text-orange-800 border border-orange-300",
        silver: "bg-gray-100 text-gray-700 border border-gray-300",
        gold: "bg-yellow-100 text-yellow-800 border border-yellow-300",
        diamond: "bg-cyan-100 text-cyan-700 border border-cyan-300",
        champion: "bg-purple-100 text-purple-700 border border-purple-300",
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

export { badgeVariants };
