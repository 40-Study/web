"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Group } from "@/services/group.service";
import { canInvite } from "./group-permissions";
import { InviteMembersDialog } from "./invite-members-dialog";
import { MemberList } from "./member-list";

/** Tab Thành viên: danh sách chỉ đọc + nút "Mời" cho OWNER/ADMIN/MOD. Đổi vai / gỡ / cấm nằm ở tab Quản lý. */
export function GroupMembersTab({ group, viewerId }: { group: Group; viewerId?: string }) {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{group.member_count} thành viên</h2>
        {canInvite(group.my_role) && (
          <>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Mời
            </Button>
            <InviteMembersDialog group={group} open={inviteOpen} onOpenChange={setInviteOpen} />
          </>
        )}
      </div>
      <MemberList group={group} viewerId={viewerId} />
    </div>
  );
}
