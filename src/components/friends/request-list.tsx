"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QueryState } from "@/components/common/query-state";
import { PaginationControls } from "@/components/common/pagination-controls";
import {
  useAcceptFriendRequest,
  useCancelFriendRequest,
  useDeclineFriendRequest,
  useFriendRequests,
  useFriendSummary,
} from "@/hooks/queries/use-friends";
import { friendDisplayName, type RequestDirection } from "@/services/friend.service";
import { PersonRow } from "./person-row";

const PAGE_SIZE = 20;

function formatSent(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `Gửi ngày ${d.toLocaleDateString("vi-VN")}`;
}

/** Hai nhóm con: "Nhận được" (chấp nhận / từ chối) và "Đã gửi" (huỷ lời mời). */
export function RequestList() {
  const [direction, setDirection] = useState<RequestDirection>("incoming");
  const [page, setPage] = useState(1);
  const { data: summary } = useFriendSummary();
  const { data, isLoading, isError, error, refetch } = useFriendRequests(direction, { page, limit: PAGE_SIZE });
  const accept = useAcceptFriendRequest();
  const decline = useDeclineFriendRequest();
  const cancel = useCancelFriendRequest();

  const requests = data?.requests ?? [];
  const incomingCount = summary?.incoming_requests ?? 0;
  const outgoingCount = summary?.outgoing_requests ?? 0;

  const switchTo = (next: RequestDirection) => {
    setDirection(next);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="group" aria-label="Loại lời mời">
        <Button
          size="sm"
          variant={direction === "incoming" ? "default" : "outline"}
          aria-pressed={direction === "incoming"}
          onClick={() => switchTo("incoming")}
        >
          Nhận được{incomingCount > 0 && ` (${incomingCount})`}
        </Button>
        <Button
          size="sm"
          variant={direction === "outgoing" ? "default" : "outline"}
          aria-pressed={direction === "outgoing"}
          onClick={() => switchTo("outgoing")}
        >
          Đã gửi{outgoingCount > 0 && ` (${outgoingCount})`}
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={requests.length === 0}
        emptyTitle={direction === "incoming" ? "Không có lời mời nào" : "Bạn chưa gửi lời mời nào"}
        emptyDescription={
          direction === "incoming"
            ? "Khi có bạn học gửi lời mời kết bạn, bạn sẽ thấy ở đây."
            : "Lời mời bạn gửi đi đang chờ phản hồi sẽ hiện ở đây."
        }
        onRetry={() => refetch()}
      >
        <Card className="divide-y">
          {requests.map((req) => {
            const name = friendDisplayName(req.user);
            return (
              <PersonRow
                key={req.id}
                user={req.user}
                subtitle={formatSent(req.created_at)}
                actions={
                  req.direction === "incoming" ? (
                    <>
                      <Button
                        size="sm"
                        aria-label={`Chấp nhận lời mời của ${name}`}
                        disabled={accept.isPending}
                        onClick={() => accept.mutate(req.id)}
                      >
                        <Check className="mr-1.5 h-4 w-4" aria-hidden="true" />
                        Chấp nhận
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Từ chối lời mời của ${name}`}
                        disabled={decline.isPending}
                        onClick={() => decline.mutate(req.id)}
                      >
                        <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
                        Từ chối
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`Huỷ lời mời gửi ${name}`}
                      disabled={cancel.isPending}
                      onClick={() => cancel.mutate(req.id)}
                    >
                      Huỷ lời mời
                    </Button>
                  )
                }
              />
            );
          })}
        </Card>
        <PaginationControls page={page} totalCount={data?.total_count ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </QueryState>
    </div>
  );
}
