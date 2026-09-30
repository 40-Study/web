"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QueryState } from "@/components/common/query-state";
import { useBannedMembers, useUnbanMember } from "@/hooks/queries/use-groups";
import type { Group } from "@/services/group.service";
import { MEMBERS_PAGE_SIZE } from "./member-list";
import { PaginationControls } from "@/components/common/pagination-controls";

/** Danh sách bị cấm (`?status=BANNED`, chỉ OWNER/ADMIN): bỏ cấm để họ xin vào lại được. */
export function BannedMemberList({ group }: { group: Group }) {
  const [page, setPage] = useState(1);
  // Section này chỉ được render cho OWNER/ADMIN (getManageSections) nên luôn được phép gọi.
  const { data, isLoading, isError, error, refetch } = useBannedMembers(group.id, true, {
    page,
    limit: MEMBERS_PAGE_SIZE,
  });
  const unban = useUnbanMember();
  // Backend chưa hỗ trợ `?status=BANNED` sẽ lờ tham số và trả danh sách ACTIVE (kể cả chủ nhóm) — hiện
  // những người đó kèm nút "Bỏ cấm" là SAI. Mỗi dòng mang `status` riêng nên chỉ giữ dòng thật sự BANNED:
  // backend cũ thì danh sách rỗng (trung thực), backend mới thì không đổi gì.
  const banned = (data?.members ?? []).filter((m) => m.status === "BANNED");

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={banned.length === 0}
      emptyTitle="Chưa cấm ai"
      emptyDescription="Thành viên bị cấm sẽ xuất hiện ở đây."
      onRetry={() => refetch()}
    >
      <Card className="divide-y">
        {banned.map((member) => (
          <div key={member.id} className="flex items-center gap-3 p-3 sm:p-4">
            <Avatar src={member.avatar_url} fallback={member.user_name || "?"} size="md" />
            <p className="min-w-0 flex-1 truncate font-medium">{member.user_name}</p>
            <Button
              variant="outline"
              size="sm"
              disabled={unban.isPending}
              onClick={() => unban.mutate({ groupId: group.id, userId: member.user_id })}
              aria-label={`Bỏ cấm ${member.user_name}`}
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Bỏ cấm
            </Button>
          </div>
        ))}
      </Card>
      <PaginationControls
        page={page}
        totalCount={data?.total_count ?? 0}
        pageSize={MEMBERS_PAGE_SIZE}
        onPageChange={setPage}
      />
    </QueryState>
  );
}
