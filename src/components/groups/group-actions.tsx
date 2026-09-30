"use client";

import { useState } from "react";
import { Clock, DoorOpen, Loader2, LogOut, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useJoinGroup, useLeaveGroup } from "@/hooks/queries/use-groups";
import type { Group } from "@/services/group.service";
import { getPrimaryAction } from "./group-permissions";
import { RequestJoinDialog } from "./request-join-dialog";

interface GroupActionsProps {
  group: Group;
  /** Gọi sau khi rời nhóm thành công (trang điều hướng về danh sách nhóm). */
  onLeft?: () => void;
}

/** Nút hành động chính trong header nhóm; loại nút do `getPrimaryAction` quyết định. */
export function GroupActions({ group, onLeft }: GroupActionsProps) {
  const join = useJoinGroup();
  const leave = useLeaveGroup();
  const [requestOpen, setRequestOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const action = getPrimaryAction(group);

  switch (action) {
    case "join":
      return (
        <Button onClick={() => join.mutate({ id: group.id })} disabled={join.isPending}>
          {join.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Tham gia
        </Button>
      );

    case "request":
      return (
        <>
          <Button onClick={() => setRequestOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
            Xin tham gia
          </Button>
          <RequestJoinDialog
            open={requestOpen}
            onOpenChange={setRequestOpen}
            groupName={group.name}
            pending={join.isPending}
            onSubmit={(message) =>
              join.mutate({ id: group.id, message }, { onSuccess: () => setRequestOpen(false) })
            }
          />
        </>
      );

    case "requested":
      return (
        <Button variant="outline" disabled>
          <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
          Đã gửi yêu cầu
        </Button>
      );

    case "leave":
      return (
        <>
          <Button variant="outline" onClick={() => setLeaveOpen(true)}>
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            Rời nhóm
          </Button>
          <ConfirmDialog
            open={leaveOpen}
            onOpenChange={setLeaveOpen}
            title="Rời nhóm?"
            description={`Bạn sẽ không còn thấy tin nhắn và hoạt động của nhóm "${group.name}".`}
            confirmLabel="Rời nhóm"
            destructive
            pending={leave.isPending}
            onConfirm={() =>
              leave.mutate(group.id, {
                onSuccess: () => {
                  setLeaveOpen(false);
                  onLeft?.();
                },
              })
            }
          />
        </>
      );

    default:
      // Chủ nhóm: không có nút (không rời được, xoá nhóm nằm ở Quản lý > Cài đặt).
      return group.my_role === "OWNER" ? (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <DoorOpen className="h-4 w-4" aria-hidden="true" />
          Bạn là trưởng nhóm
        </span>
      ) : null;
  }
}
