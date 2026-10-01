"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QueryState } from "@/components/common/query-state";
import { PaginationControls } from "@/components/common/pagination-controls";
import { useBlocks, useUnblockUser } from "@/hooks/queries/use-friends";
import { friendDisplayName } from "@/services/friend.service";
import { PersonRow } from "./person-row";

const PAGE_SIZE = 20;

export function BlockedList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useBlocks({ page, limit: PAGE_SIZE });
  const unblock = useUnblockUser();
  const blocks = data?.blocks ?? [];

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={blocks.length === 0}
      emptyTitle="Bạn chưa chặn ai"
      emptyDescription="Người bị chặn không thể gửi lời mời kết bạn cho bạn."
      onRetry={() => refetch()}
    >
      <Card className="divide-y">
        {blocks.map((item) => (
          <PersonRow
            key={item.user.user_id}
            user={item.user}
            actions={
              <Button
                size="sm"
                variant="outline"
                aria-label={`Bỏ chặn ${friendDisplayName(item.user)}`}
                disabled={unblock.isPending}
                onClick={() => unblock.mutate(item.user.user_id)}
              >
                Bỏ chặn
              </Button>
            }
          />
        ))}
      </Card>
      <PaginationControls page={page} totalCount={data?.total_count ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </QueryState>
  );
}
