"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { friendDisplayName, type FriendUser } from "@/services/friend.service";

interface PersonRowProps {
  user: FriendUser;
  /** Dòng phụ dưới tên (vd. "Bạn từ 12/03/2026"). */
  subtitle?: React.ReactNode;
  /** Cụm nút bên phải (xuống dòng riêng ở màn hình hẹp). */
  actions?: React.ReactNode;
}

/** Một dòng người dùng dùng chung cho Bạn bè / Lời mời / Tìm người / Đã chặn. Không bao giờ hiện email/điện thoại. */
export function PersonRow({ user, subtitle, actions }: PersonRowProps) {
  const name = friendDisplayName(user);
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
      <Avatar src={user.avatar_url} fallback={name} size="md" />
      <div className="min-w-0 flex-1">
        <Link href={`/profile/${user.user_id}`} className="block truncate font-medium hover:text-primary">
          {name}
        </Link>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">{actions}</div>}
    </div>
  );
}
