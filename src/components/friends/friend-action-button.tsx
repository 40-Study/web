"use client";

import { useState } from "react";
import { Ban, Check, Loader2, UserCheck, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  useAcceptFriendRequest,
  useCancelFriendRequest,
  useRelationship,
  useSendFriendRequest,
  useUnblockUser,
  useUnfriend,
} from "@/hooks/queries/use-friends";
import type { RelationStatus } from "@/services/friend.service";

interface FriendActionButtonProps {
  userId: string;
  status: RelationStatus;
  /** Id lời mời khi `status` là PENDING_*. Thiếu thì tự tra qua `GET /friends/relationship/:userId`. */
  requestId?: string;
  /** Tên người kia, dùng cho `aria-label` và câu xác nhận huỷ kết bạn. */
  name?: string;
  className?: string;
}

/**
 * Đúng MỘT nút theo `relationship`: NONE "Kết bạn" · PENDING_OUT "Huỷ lời mời" · PENDING_IN "Chấp nhận" ·
 * FRIENDS "Bạn bè" (bấm để huỷ kết bạn, có xác nhận) · BLOCKED_BY_ME "Bỏ chặn" · SELF không có nút.
 *
 * Kết quả tìm kiếm chỉ trả `relationship` mà KHÔNG có `request_id` (contract §1), trong khi huỷ/chấp
 * nhận cần id lời mời — nên với PENDING_* ta tự tra một lần và khoá nút tới khi có id.
 */
export function FriendActionButton({ userId, status, requestId, name, className }: FriendActionButtonProps) {
  const send = useSendFriendRequest();
  const accept = useAcceptFriendRequest();
  const cancel = useCancelFriendRequest();
  const unfriend = useUnfriend();
  const unblock = useUnblockUser();
  const [confirmUnfriend, setConfirmUnfriend] = useState(false);

  const isPending = status === "PENDING_OUT" || status === "PENDING_IN";
  const lookup = useRelationship(userId, isPending && !requestId);
  const resolvedRequestId = requestId ?? lookup.data?.request_id;

  // Có tên thì nhãn đọc rõ đối tượng ("Kết bạn với Lan"); không có thì để chữ hiển thị tự làm tên,
  // không treo chữ "với" lơ lửng.
  const label = (action: string) => (name ? `${action} ${name}` : undefined);
  const busy = (flag: boolean) =>
    flag ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null;

  switch (status) {
    case "NONE":
      return (
        <Button size="sm" className={className} aria-label={label("Kết bạn với")} disabled={send.isPending} onClick={() => send.mutate(userId)}>
          {busy(send.isPending) ?? <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />}
          Kết bạn
        </Button>
      );

    case "PENDING_OUT":
      return (
        <Button
          size="sm"
          variant="outline"
          className={className}
          aria-label={label("Huỷ lời mời kết bạn với")}
          disabled={!resolvedRequestId || cancel.isPending}
          onClick={() => resolvedRequestId && cancel.mutate(resolvedRequestId)}
        >
          {busy(cancel.isPending) ?? <X className="mr-2 h-4 w-4" aria-hidden="true" />}
          Huỷ lời mời
        </Button>
      );

    case "PENDING_IN":
      return (
        <Button
          size="sm"
          className={className}
          aria-label={label("Chấp nhận lời mời của")}
          disabled={!resolvedRequestId || accept.isPending}
          onClick={() => resolvedRequestId && accept.mutate(resolvedRequestId)}
        >
          {busy(accept.isPending) ?? <Check className="mr-2 h-4 w-4" aria-hidden="true" />}
          Chấp nhận
        </Button>
      );

    case "FRIENDS":
      return (
        <>
          <Button
            size="sm"
            variant="outline"
            className={className}
            aria-label={label("Bạn bè với")}
            onClick={() => setConfirmUnfriend(true)}
          >
            <UserCheck className="mr-2 h-4 w-4" aria-hidden="true" />
            Bạn bè
          </Button>
          <ConfirmDialog
            open={confirmUnfriend}
            onOpenChange={setConfirmUnfriend}
            title="Huỷ kết bạn?"
            description={name ? `Bạn và ${name} sẽ không còn là bạn bè.` : "Hai bạn sẽ không còn là bạn bè."}
            confirmLabel="Huỷ kết bạn"
            destructive
            pending={unfriend.isPending}
            onConfirm={() => unfriend.mutate(userId, { onSuccess: () => setConfirmUnfriend(false) })}
          />
        </>
      );

    case "BLOCKED_BY_ME":
      return (
        <Button
          size="sm"
          variant="outline"
          className={className}
          aria-label={label("Bỏ chặn")}
          disabled={unblock.isPending}
          onClick={() => unblock.mutate(userId)}
        >
          {busy(unblock.isPending) ?? <Ban className="mr-2 h-4 w-4" aria-hidden="true" />}
          Bỏ chặn
        </Button>
      );

    default:
      // SELF (và mọi giá trị lạ trong tương lai): không có hành động kết bạn.
      return null;
  }
}
