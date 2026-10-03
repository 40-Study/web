"use client";

import { useMemo, useState } from "react";
import { QueryState } from "@/components/common/query-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useActiveOrgId, useOrgMembers } from "@/hooks/queries/use-org-area";
import { getSystemRoleLabel } from "@/lib/role-labels";

/** Thành viên tổ chức: tên, email và các vai trò đang giữ (không còn chỉ user_id). */
export default function OrgMembersPage() {
  const orgId = useActiveOrgId();
  const { data = [], isLoading, isError, error, refetch } = useOrgMembers(orgId);
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return data;
    return data.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [data, keyword]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold">Thành viên ({data.length})</h2>
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo tên hoặc email"
          aria-label="Tìm thành viên"
          className="w-full sm:w-72"
        />
      </div>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={filtered.length === 0}
        emptyTitle={keyword ? "Không có thành viên phù hợp" : "Tổ chức chưa có thành viên"}
        emptyDescription={keyword ? "Thử từ khoá khác." : undefined}
      >
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {filtered.map((m) => (
            <li key={m.user_id} className="flex flex-wrap items-center gap-3 p-4">
              <Avatar src={m.avatar_url} fallback={m.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.name}</p>
                <p className="truncate text-sm text-muted-foreground">{m.email}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {m.roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {getSystemRoleLabel(role)}
                  </Badge>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </QueryState>
    </div>
  );
}
