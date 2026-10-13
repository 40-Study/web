"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToggleWishlist, useWishlistIds } from "@/hooks/queries/use-wishlist";
import { normalizeRole, resolveNavRole } from "@/lib/routes";
import { useAuthStore } from "@/stores/auth.store";

interface WishlistButtonProps {
  courseId: string;
  /** `icon`: tim tròn đặt đè lên thẻ khoá học; `button`: nút có chữ ở trang chi tiết. */
  variant?: "icon" | "button";
  className?: string;
}

/**
 * Trái tim lưu khoá học vào danh sách yêu thích (QA2 F-10). Khách bấm thì sang đăng nhập rồi quay lại; phụ huynh
 * và admin không dùng wishlist nên không hiện. Đặt được bên trong thẻ có link: chặn hành vi mặc định của click.
 */
export function WishlistButton({ courseId, variant = "icon", className }: WishlistButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const activeRole = useAuthStore((s) => s.activeRole);
  const navRole = resolveNavRole(isAuthenticated, normalizeRole(activeRole));
  const canUse = navRole === "GUEST" || navRole === "STUDENT";

  const { data: savedIds = [] } = useWishlistIds(isAuthenticated && canUse);
  const toggle = useToggleWishlist();

  if (!canUse) return null;

  const saved = savedIds.includes(courseId);
  const label = saved ? "Bỏ khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích";

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    toggle.mutate({ courseId, saved });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggle.isPending}
      aria-label={label}
      aria-pressed={saved}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60",
        variant === "icon"
          ? "h-9 w-9 rounded-full bg-white/95 text-slate-600 shadow-xs backdrop-blur-sm hover:text-rose-600 dark:bg-slate-900/95 dark:text-slate-300"
          : "rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:border-rose-300 hover:text-rose-600",
        saved && "text-rose-600",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-rose-500")} aria-hidden="true" />
      {variant === "button" && <span>{saved ? "Đã lưu yêu thích" : "Lưu vào yêu thích"}</span>}
    </button>
  );
}
