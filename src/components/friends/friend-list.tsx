"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, MessageCircle, Search, UserMinus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QueryState } from "@/components/common/query-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PaginationControls } from "@/components/common/pagination-controls";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCreateDirectConversation } from "@/hooks/queries/use-conversations";
import { SEARCH_DEBOUNCE_MS, useBlockUser, useFriends, useUnfriend } from "@/hooks/queries/use-friends";
import { friendDisplayName, type FriendItem } from "@/services/friend.service";
import { PersonRow } from "./person-row";

const PAGE_SIZE = 20;

type Pending = { kind: "unfriend" | "block"; item: FriendItem } | null;

function formatSince(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `Bạn bè từ ${d.toLocaleDateString("vi-VN")}`;
}

export function FriendList() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<Pending>(null);
  const debounced = useDebouncedValue(keyword.trim(), SEARCH_DEBOUNCE_MS);
  const { data, isLoading, isError, error, refetch } = useFriends({
    page,
    limit: PAGE_SIZE,
    keyword: debounced || undefined,
  });
  const unfriend = useUnfriend();
  const block = useBlockUser();
  const startChat = useCreateDirectConversation();

  const friends = data?.friends ?? [];
  const closePending = () => setPending(null);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          aria-label="Lọc bạn bè"
          placeholder="Lọc theo tên..."
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={friends.length === 0}
        emptyTitle={debounced ? "Không có bạn nào khớp" : "Bạn chưa có bạn bè nào"}
        emptyDescription={
          debounced ? "Thử từ khoá khác." : (
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" aria-hidden="true" />
              Sang tab &quot;Tìm người&quot; để kết bạn với các bạn học.
            </span>
          )
        }
        onRetry={() => refetch()}
      >
        <Card className="divide-y">
          {friends.map((item) => {
            const name = friendDisplayName(item.user);
            return (
              <PersonRow
                key={item.friendship_id}
                user={item.user}
                subtitle={formatSince(item.since)}
                actions={
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`Nhắn tin cho ${name}`}
                      disabled={startChat.isPending}
                      onClick={() =>
                        startChat.mutate(item.user.user_id, {
                          onSuccess: (conv) => router.push(`/messages?conversation=${conv.id}`),
                        })
                      }
                    >
                      <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Nhắn tin
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Huỷ kết bạn với ${name}`}
                      onClick={() => setPending({ kind: "unfriend", item })}
                    >
                      <UserMinus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Huỷ kết bạn
                    </Button>
                    <Button
                      size="sm"
                      variant="destructiveGhost"
                      aria-label={`Chặn ${name}`}
                      onClick={() => setPending({ kind: "block", item })}
                    >
                      <Ban className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Chặn
                    </Button>
                  </>
                }
              />
            );
          })}
        </Card>
        <PaginationControls page={page} totalCount={data?.total_count ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </QueryState>

      {pending && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && closePending()}
          title={pending.kind === "unfriend" ? "Huỷ kết bạn?" : "Chặn người dùng này?"}
          description={
            pending.kind === "unfriend"
              ? `Bạn và ${friendDisplayName(pending.item.user)} sẽ không còn là bạn bè.`
              : `${friendDisplayName(pending.item.user)} sẽ bị xoá khỏi danh sách bạn bè, không thể gửi lời mời cho bạn và không xuất hiện khi tìm kiếm.`
          }
          confirmLabel={pending.kind === "unfriend" ? "Huỷ kết bạn" : "Chặn"}
          destructive
          pending={unfriend.isPending || block.isPending}
          onConfirm={() =>
            (pending.kind === "unfriend" ? unfriend : block).mutate(pending.item.user.user_id, {
              onSuccess: closePending,
            })
          }
        />
      )}
    </div>
  );
}
