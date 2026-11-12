"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/error-messages";
import { cn } from "@/lib/utils";
import type { OrgRoleListItem } from "@/services/role.service";
import { userService } from "@/services/user.service";
import type { OrgUserLookup } from "@/services/organization.service";
import { EmailUserLookup } from "./email-user-lookup";
import { RoleSelect } from "./role-select";

const MIN_KEYWORD_LENGTH = 2;
const MAX_RESULTS = 8;

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: OrgRoleListItem[];
  /** Người đã là thành viên: vẫn chọn được (thêm vai trò thứ hai) nhưng được đánh dấu. */
  memberIds: ReadonlySet<string>;
  onSubmit: (userId: string, roleId: string) => Promise<void>;
  /**
   * "directory": quản trị hệ thống tìm theo tên/email (GET /users, cần USERS_VIEW_ALL).
   * "email": chủ tổ chức tra đúng một email qua user-lookup của tổ chức `orgId` (QA-C-01).
   */
  lookup?: "directory" | "email";
  orgId: string;
}

/**
 * Thêm thành viên: tìm người dùng sẵn có theo tên/email (GET /users?keyword=, chỉ quản trị hệ thống có quyền
 * USERS_VIEW_ALL) rồi chọn vai trò. Lỗi từ backend (409 gán trùng...) hiện ngay trong hộp thoại.
 */
export function AddMemberDialog({ open, onOpenChange, roles, memberIds, onSubmit, lookup = "directory", orgId }: AddMemberDialogProps) {
  const byEmail = lookup === "email";
  const [found, setFound] = useState<OrgUserLookup | null>(null);
  const [keyword, setKeyword] = useState("");
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const debounced = useDebouncedValue(keyword.trim(), 300);
  const canSearch = debounced.length >= MIN_KEYWORD_LENGTH;
  const search = useQuery({
    queryKey: ["org-member-user-search", debounced],
    queryFn: () => userService.list({ keyword: debounced, limit: MAX_RESULTS }),
    enabled: open && canSearch && !byEmail,
  });
  const users = search.data?.items ?? [];

  useEffect(() => {
    if (!open) {
      setKeyword("");
      setUserId("");
      setFound(null);
      setRoleId("");
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      await onSubmit(byEmail ? (found?.id ?? "") : userId, roleId);
      onOpenChange(false);
    } catch (e) {
      setError(getErrorMessage(e, "Không thể thêm thành viên, thử lại sau."));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Thêm thành viên</DialogTitle>
        <DialogDescription>
          {byEmail
            ? "Tìm người đã có tài khoản bằng email, rồi chọn vai trò trong tổ chức."
            : "Tìm người dùng đã có tài khoản theo tên hoặc email, rồi chọn vai trò trong tổ chức."}
        </DialogDescription>
        <div className="mt-2 space-y-3">
          {byEmail ? (
            <EmailUserLookup orgId={orgId} memberIds={memberIds} selected={found} onSelect={setFound} />
          ) : (
          <>
          <Input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setUserId("");
            }}
            placeholder="Tìm theo tên hoặc email"
            aria-label="Tìm người dùng"
            autoComplete="off"
          />
          {canSearch && (
            <ul aria-label="Kết quả tìm kiếm" className="max-h-56 divide-y divide-border overflow-y-auto rounded-xl border border-border">
              {search.isLoading && <li className="p-3 text-sm text-muted-foreground">Đang tìm…</li>}
              {search.isError && (
                <li role="alert" className="p-3 text-sm text-red-600 dark:text-red-400">
                  {getErrorMessage(search.error, "Không tìm được người dùng, thử lại sau.")}
                </li>
              )}
              {search.isSuccess && users.length === 0 && (
                <li className="p-3 text-sm text-muted-foreground">Không có người dùng phù hợp.</li>
              )}
              {users.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    aria-pressed={u.id === userId}
                    onClick={() => setUserId(u.id)}
                    className={cn(
                      "flex w-full items-center gap-3 p-3 text-left hover:bg-muted",
                      u.id === userId && "bg-primary-50 dark:bg-primary-950"
                    )}
                  >
                    <Avatar src={u.avatar_url ?? undefined} fallback={u.full_name || u.user_name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{u.full_name || u.user_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                    </span>
                    {memberIds.has(u.id) && <Badge variant="secondary">Đã là thành viên</Badge>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          </>
          )}
          <RoleSelect roles={roles} value={roleId} onChange={setRoleId} ariaLabel="Vai trò trong tổ chức" />
          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={!(byEmail ? found : userId) || !roleId || pending} isLoading={pending}>
            Thêm thành viên
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
