"use client";

import { Badge } from "@/components/ui/badge";
import { isPendingPastStart } from "@/lib/contest-manage/actions";
import { PENDING_PAST_START_LABEL } from "@/lib/contest-manage/labels";
import type { ContestManage } from "@/types/contest";

/** Huy hiệu cảnh báo cho cuộc thi chờ duyệt đã quá giờ bắt đầu (giảng viên: danh sách + chi tiết). Không hiện thì trả null. */
export function PendingPastStartBadge({ contest, now }: { contest: Pick<ContestManage, "status" | "start_time">; now?: Date }) {
  if (!isPendingPastStart(contest, now ?? new Date())) return null;
  return (
    <Badge variant="warning" data-testid="pending-past-start">
      {PENDING_PAST_START_LABEL}
    </Badge>
  );
}
