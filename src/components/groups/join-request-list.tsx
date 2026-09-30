"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QueryState } from "@/components/common/query-state";
import {
  useApproveJoinRequest,
  useGroupJoinRequests,
  useRejectJoinRequest,
} from "@/hooks/queries/use-groups";
import type { Group, JoinRequest } from "@/services/group.service";
import { formatVnDate } from "./group-labels";

/** Lý do từ chối tuỳ chọn; giới hạn để không gửi đoạn văn dài vào thông báo. */
const REJECT_REASON_MAX = 300;

/** Yêu cầu xin vào đang chờ duyệt: chấp nhận ngay, từ chối kèm lý do tuỳ chọn. */
export function JoinRequestList({ group }: { group: Group }) {
  const { data, isLoading, isError, error, refetch } = useGroupJoinRequests(group.id);
  const approve = useApproveJoinRequest();
  const reject = useRejectJoinRequest();
  const [rejecting, setRejecting] = useState<JoinRequest | null>(null);
  const [reason, setReason] = useState("");

  const requests = (data?.requests ?? []).filter((r) => r.status === "PENDING");

  const closeReject = () => {
    setRejecting(null);
    setReason("");
  };

  return (
    <div>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={requests.length === 0}
        emptyTitle="Không có yêu cầu nào đang chờ"
        emptyDescription="Khi có người xin tham gia nhóm, yêu cầu sẽ xuất hiện ở đây."
        onRetry={() => refetch()}
      >
        <Card className="divide-y">
          {requests.map((req) => (
            <div key={req.id} className="flex flex-wrap items-start gap-3 p-3 sm:p-4">
              <Avatar src={req.avatar_url} fallback={req.user_name || "?"} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{req.user_name}</p>
                <p className="text-xs text-muted-foreground">Gửi lúc {formatVnDate(req.created_at)}</p>
                {req.message && <p className="mt-1 break-words text-sm text-muted-foreground">&ldquo;{req.message}&rdquo;</p>}
              </div>
              <div className="flex w-full justify-end gap-2 sm:w-auto">
                <Button
                  size="sm"
                  onClick={() => approve.mutate({ groupId: group.id, requestId: req.id })}
                  disabled={approve.isPending}
                  aria-label={`Chấp nhận yêu cầu của ${req.user_name}`}
                >
                  <Check className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Chấp nhận
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRejecting(req)}
                  aria-label={`Từ chối yêu cầu của ${req.user_name}`}
                >
                  <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Từ chối
                </Button>
              </div>
            </div>
          ))}
        </Card>
      </QueryState>

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && closeReject()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu của {rejecting?.user_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Lý do (không bắt buộc)</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              maxLength={REJECT_REASON_MAX}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReject} disabled={reject.isPending}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              disabled={reject.isPending}
              onClick={() =>
                rejecting &&
                reject.mutate(
                  { groupId: group.id, requestId: rejecting.id, reason: reason.trim() || undefined },
                  { onSuccess: closeReject }
                )
              }
            >
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
