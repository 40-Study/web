"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QueryState } from "@/components/common/query-state";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { SEARCH_DEBOUNCE_MS, useFriends } from "@/hooks/queries/use-friends";
import { useGroupMembers, useInviteGroupMembers } from "@/hooks/queries/use-groups";
import { friendDisplayName } from "@/services/friend.service";
import type { Group, InviteMembersResult } from "@/services/group.service";
import { InviteResultSummary } from "./invite-result-summary";

/** Khớp `max=50` của `InviteMembersRequest` ở backend. */
export const INVITE_MAX = 50;
const FRIENDS_LIMIT = 100;

interface InviteMembersDialogProps {
  group: Group;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Mời bạn bè vào nhóm. Nguồn chọn người là DANH SÁCH BẠN BÈ của người mời: backend chỉ cho mời người
 * có quan hệ hợp lệ và web không có API tìm user tuỳ ý. Mọi quyết định cuối (đầy nhóm, bị cấm, quan hệ)
 * thuộc backend — phía web chỉ gợi ý và hiển thị lý do từ chối.
 */
export function InviteMembersDialog({ group, open, onOpenChange }: InviteMembersDialogProps) {
  const [keyword, setKeyword] = useState("");
  // id -> tên, để vừa đếm vừa tra tên người bị từ chối (backend chỉ trả id).
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [outcome, setOutcome] = useState<{ result: InviteMembersResult; names: Record<string, string> } | null>(null);
  const debounced = useDebouncedValue(keyword.trim(), SEARCH_DEBOUNCE_MS);

  const friendsQuery = useFriends({ limit: FRIENDS_LIMIT, keyword: debounced || undefined }, open);
  const membersQuery = useGroupMembers(group.id, { limit: FRIENDS_LIMIT }, open);
  const invite = useInviteGroupMembers();

  useEffect(() => {
    if (!open) {
      setKeyword("");
      setSelected({});
      setOutcome(null);
    }
  }, [open]);

  const memberIds = useMemo(() => new Set((membersQuery.data?.members ?? []).map((m) => m.user_id)), [membersQuery.data]);
  const friends = friendsQuery.data?.friends ?? [];
  const selectedIds = Object.keys(selected);
  const freeSlots = group.max_members - group.member_count;
  const overCapacity = selectedIds.length > freeSlots;
  // Chờ biết ai đã trong nhóm rồi mới cho mời (nếu danh sách chưa đủ thì backend vẫn chặn bằng GROUP_ALREADY_MEMBER).
  const ready = !membersQuery.isLoading;

  const toggle = (userId: string, name: string, checked: boolean) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) next[userId] = name;
      else delete next[userId];
      return next;
    });

  const submit = () =>
    invite.mutate(
      { groupId: group.id, userIds: selectedIds },
      { onSuccess: (res) => setOutcome({ result: res.data, names: selected }) }
    );

  const reselectRejected = () => {
    if (!outcome) return;
    setSelected(
      Object.fromEntries(outcome.result.rejected.map((r) => [r.user_id, outcome.names[r.user_id] ?? "Người dùng"]))
    );
    setOutcome(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mời bạn bè vào nhóm</DialogTitle>
          <DialogDescription>Chọn bạn bè để thêm vào &quot;{group.name}&quot;.</DialogDescription>
        </DialogHeader>

        {outcome ? (
          <InviteResultSummary
            result={outcome.result}
            nameOf={(id) => outcome.names[id] ?? "Người dùng"}
            onReselectRejected={reselectRejected}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                aria-label="Tìm trong danh sách bạn bè"
                placeholder="Tìm bạn bè..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-72 overflow-y-auto rounded-lg border">
              <QueryState
                isLoading={friendsQuery.isLoading}
                isError={friendsQuery.isError}
                error={friendsQuery.error}
                isEmpty={friends.length === 0}
                emptyTitle={debounced ? "Không có bạn nào khớp" : "Bạn chưa có bạn bè nào"}
                emptyDescription={
                  debounced ? (
                    "Thử từ khoá khác."
                  ) : (
                    <>
                      Kết bạn để mời vào nhóm.{" "}
                      <Link href="/friends?tab=search" className="font-medium text-primary underline">
                        Tìm bạn
                      </Link>
                    </>
                  )
                }
                onRetry={() => friendsQuery.refetch()}
                className="border-none py-8"
              >
                <ul className="divide-y">
                  {friends.map(({ friendship_id, user }) => {
                    const name = friendDisplayName(user);
                    const inGroup = memberIds.has(user.user_id);
                    const checked = user.user_id in selected;
                    const id = `invite-${user.user_id}`;
                    return (
                      <li key={friendship_id} className={`flex items-center gap-3 p-2.5 ${inGroup ? "opacity-50" : ""}`}>
                        <Checkbox
                          id={id}
                          checked={checked}
                          disabled={inGroup || (!checked && selectedIds.length >= INVITE_MAX)}
                          onCheckedChange={(c) => toggle(user.user_id, name, c)}
                        />
                        <Avatar src={user.avatar_url} fallback={name} size="sm" />
                        <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer truncate text-sm font-medium">
                          {name}
                        </label>
                        {inGroup && <span className="shrink-0 text-xs text-muted-foreground">Đã trong nhóm</span>}
                      </li>
                    );
                  })}
                </ul>
              </QueryState>
            </div>

            <p className="text-sm text-muted-foreground">
              Đã chọn {selectedIds.length}/{INVITE_MAX}
            </p>
            {overCapacity && (
              <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">
                Nhóm chỉ còn {Math.max(0, freeSlots)} chỗ trống, một số người có thể không vào được.
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Huỷ
              </Button>
              <Button onClick={submit} disabled={selectedIds.length === 0 || invite.isPending || !ready}>
                {invite.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Mời ({selectedIds.length})
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
