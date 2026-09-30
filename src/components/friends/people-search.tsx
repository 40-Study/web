"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QueryState } from "@/components/common/query-state";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS, useFriendSearch } from "@/hooks/queries/use-friends";
import { friendDisplayName } from "@/services/friend.service";
import { FriendActionButton } from "./friend-action-button";
import { PersonRow } from "./person-row";

/**
 * Tìm học viên để kết bạn. Chỉ gọi API khi đã gõ đủ MIN_SEARCH_LENGTH ký tự (đã trim) và đã ngừng gõ
 * SEARCH_DEBOUNCE_MS — backend giới hạn 30 lượt tìm/phút/người và từ chối câu ngắn.
 */
export function PeopleSearch() {
  const [input, setInput] = useState("");
  const debounced = useDebouncedValue(input, SEARCH_DEBOUNCE_MS);
  const term = debounced.trim();
  const tooShort = term.length < MIN_SEARCH_LENGTH;
  const { data, isLoading, isError, error, refetch } = useFriendSearch(debounced);
  const users = data?.users ?? [];

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          aria-label="Tìm học viên"
          placeholder="Tìm theo tên học viên..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="pl-9"
        />
      </div>

      {tooShort ? (
        <p className="text-sm text-muted-foreground">Nhập ít nhất {MIN_SEARCH_LENGTH} ký tự để tìm học viên.</p>
      ) : (
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={users.length === 0}
          emptyTitle="Không tìm thấy học viên phù hợp"
          emptyDescription="Kiểm tra lại chính tả hoặc thử tên khác."
          onRetry={() => refetch()}
        >
          <Card className="divide-y">
            {users.map((user) => (
              <PersonRow
                key={user.user_id}
                user={user}
                actions={
                  <FriendActionButton
                    userId={user.user_id}
                    status={user.relationship}
                    requestId={user.request_id}
                    name={friendDisplayName(user)}
                  />
                }
              />
            ))}
          </Card>
        </QueryState>
      )}
    </div>
  );
}
