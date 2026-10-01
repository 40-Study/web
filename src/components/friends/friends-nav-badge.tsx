"use client";

import { useFriendSummary } from "@/hooks/queries/use-friends";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { canUseFriends } from "./friends-access";

/** Chấm số lời mời kết bạn đang chờ, đặt góc trên phải icon "Bạn bè". Không có lời mời thì không hiện gì. */
export function FriendsNavBadge({ className }: { className?: string }) {
  // Vai khác STUDENT gọi /friends/summary sẽ nhận 403 mỗi 30 giây: tắt query theo vai thật.
  const activeRole = useAuthStore((s) => s.activeRole);
  const { data } = useFriendSummary(canUseFriends(activeRole));
  const count = canUseFriends(activeRole) ? (data?.incoming_requests ?? 0) : 0;
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
