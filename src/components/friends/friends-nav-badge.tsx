"use client";

import { useFriendSummary } from "@/hooks/queries/use-friends";
import { cn } from "@/lib/utils";

/** Chấm số lời mời kết bạn đang chờ, đặt góc trên phải icon "Bạn bè". Không có lời mời thì không hiện gì. */
export function FriendsNavBadge({ className }: { className?: string }) {
  // Chỉ được mount ở mục menu dành cho STUDENT (roles của /friends), nên không gọi API sai vai.
  const { data } = useFriendSummary();
  const count = data?.incoming_requests ?? 0;
  if (count <= 0) return null;
  return (
    <span
      role="status"
      aria-label={`${count} lời mời kết bạn mới`}
      className={cn(
        "absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
