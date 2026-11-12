"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { organizationService, type OrgUserLookup } from "@/services/organization.service";
import { userLookupErrorMessage } from "./user-lookup-error";

interface EmailUserLookupProps {
  orgId: string;
  memberIds: ReadonlySet<string>;
  selected: OrgUserLookup | null;
  onSelect: (user: OrgUserLookup | null) => void;
}

/**
 * Chủ tổ chức thêm người bằng EMAIL CHÍNH XÁC (QA-C-01): không có quyền liệt kê người dùng (GET /users cần
 * USERS_VIEW_ALL) nên tra từng email qua user-lookup, trúng thì chọn luôn người đó.
 */
export function EmailUserLookup({ orgId, memberIds, selected, onSelect }: EmailUserLookupProps) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    const value = email.trim();
    if (!value) {
      setError("Nhập email của người cần thêm.");
      return;
    }
    setPending(true);
    setError(null);
    onSelect(null);
    try {
      onSelect(await organizationService.lookupUserByEmail(orgId, value));
    } catch (err) {
      setError(userLookupErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (selected) onSelect(null);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void search(e);
          }}
          placeholder="Email của người cần thêm"
          aria-label="Email người dùng"
          autoComplete="off"
        />
        <Button type="button" variant="outline" onClick={() => void search()} isLoading={pending} disabled={pending}>
          Tìm
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Nhập đúng email người đó dùng để đăng nhập.</p>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {selected && (
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-3 dark:border-primary-800 dark:bg-primary-950">
          <Avatar src={selected.avatar_url ?? undefined} fallback={selected.full_name || selected.user_name} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{selected.full_name || selected.user_name}</span>
            <span className="block truncate text-xs text-muted-foreground">{selected.email}</span>
          </span>
          {memberIds.has(selected.id) && <Badge variant="secondary">Đã là thành viên</Badge>}
        </div>
      )}
    </div>
  );
}
