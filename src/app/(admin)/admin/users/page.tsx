"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Lock, Unlock } from "lucide-react";

import { useAdminUsers, useUpdateUserStatus } from "@/hooks/queries/use-admin-users";
import { useSystemRoles } from "@/hooks/queries/use-admin";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { getSystemRoleLabel } from "@/lib/role-labels";
import { useAuthStore } from "@/stores/auth.store";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getUserActiveLabel } from "../_lib/user-status-label";
import type { AdminUserListItem, AdminUserStatusFilter } from "@/types/user";
import { QueryState } from "@/components/common/query-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const LIMIT = 20;

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString("vi-VN") : "—";
}

function parsePageParam(raw: string | null): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function parseStatusParam(raw: string | null): "ALL" | AdminUserStatusFilter {
  return raw === "active" || raw === "locked" ? raw : "ALL";
}

export default function AdminUsersPage() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-state-first (quy ước project): mở /admin/users?keyword=... đã lọc sẵn,
  // gõ/lọc thì URL cập nhật theo (replace, không push — tránh spam history mỗi
  // ký tự), refresh/mở lại link giữ nguyên bộ lọc. Khởi tạo 1 lần từ URL lúc
  // mount — searchParams đổi sau đó là DO CHÍNH state effect bên dưới ghi ra,
  // không phải nguồn cập nhật ngược cho state.
  const [keyword, setKeyword] = useState(() => searchParams.get("keyword") ?? "");
  const debouncedKeyword = useDebouncedValue(keyword, 300);
  const [roleFilter, setRoleFilter] = useState(() => searchParams.get("role") ?? "ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AdminUserStatusFilter>(() =>
    parseStatusParam(searchParams.get("status"))
  );
  const [page, setPage] = useState(() => parsePageParam(searchParams.get("page")));

  // Đổi filter → luôn quay về trang 1, tránh xin trang 5 khi kết quả lọc mới chỉ có 1 trang.
  const params = useMemo(
    () => ({
      keyword: debouncedKeyword.trim() || undefined,
      role: roleFilter === "ALL" ? undefined : roleFilter,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      limit: LIMIT,
    }),
    [debouncedKeyword, roleFilter, statusFilter, page]
  );

  useEffect(() => {
    const qs = new URLSearchParams();
    const trimmed = debouncedKeyword.trim();
    if (trimmed) qs.set("keyword", trimmed);
    if (roleFilter !== "ALL") qs.set("role", roleFilter);
    if (statusFilter !== "ALL") qs.set("status", statusFilter);
    if (page > 1) qs.set("page", String(page));
    const query = qs.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [debouncedKeyword, roleFilter, statusFilter, page, pathname, router]);

  const { data, isLoading, isError, error, refetch } = useAdminUsers(params);
  const { data: systemRoles = [] } = useSystemRoles();
  const updateStatus = useUpdateUserStatus();

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  const [lockTarget, setLockTarget] = useState<AdminUserListItem | null>(null);
  const [lockReason, setLockReason] = useState("");
  const [unlockTarget, setUnlockTarget] = useState<AdminUserListItem | null>(null);

  const resetFilterPage = () => setPage(1);

  const submitLock = async () => {
    if (!lockTarget) return;
    const reason = lockReason.trim();
    if (!reason) return;
    try {
      await updateStatus.mutateAsync({ id: lockTarget.id, data: { is_active: false, reason } });
      setLockTarget(null);
      setLockReason("");
    } catch {
      // Lỗi đã hiển thị qua toast trong hook — giữ dialog mở để admin sửa lại lý do.
    }
  };

  const submitUnlock = async () => {
    if (!unlockTarget) return;
    try {
      await updateStatus.mutateAsync({ id: unlockTarget.id, data: { is_active: true } });
      setUnlockTarget(null);
    } catch {
      // Lỗi đã hiển thị qua toast trong hook.
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Người dùng</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tìm kiếm, lọc và khoá/mở khoá tài khoản người dùng trên toàn hệ thống.
        </p>
      </div>

      {/* Thanh lọc */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Tìm theo email, tên đăng nhập, họ tên…"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            resetFilterPage();
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v);
            resetFilterPage();
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả vai trò</SelectItem>
            {systemRoles.map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {getSystemRoleLabel(role.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as "ALL" | AdminUserStatusFilter);
            resetFilterPage();
          }}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Đang hoạt động</SelectItem>
            <SelectItem value="locked">Đã khoá</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={!isLoading && !isError && items.length === 0}
        emptyTitle="Không tìm thấy người dùng nào"
        emptyDescription="Thử đổi từ khoá tìm kiếm hoặc bộ lọc."
        onRetry={() => refetch()}
      >
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Đăng nhập cuối</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((user) => {
                const isSelf = !!currentUserId && user.id === currentUserId;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link href={`/admin/users/${user.id}`} className="font-medium text-primary-700 hover:underline">
                        {user.email}
                      </Link>
                    </TableCell>
                    <TableCell>{user.full_name || user.user_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.system_roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Chưa có vai trò</span>
                        ) : (
                          user.system_roles.map((role) => (
                            <Badge key={role} variant="outline">
                              {getSystemRoleLabel(role)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "success" : "destructive"}>
                        {getUserActiveLabel(user.is_active)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(user.last_login_at)}</TableCell>
                    <TableCell className="text-right">
                      <Can permission={PERMISSIONS.USERS_BAN}>
                        {user.is_active ? (
                          <Button
                            size="sm"
                            variant="destructiveGhost"
                            disabled={isSelf}
                            title={isSelf ? "Không thể tự khoá tài khoản của chính mình" : undefined}
                            onClick={() => setLockTarget(user)}
                          >
                            <Lock className="mr-1 h-3.5 w-3.5" />
                            Khoá
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setUnlockTarget(user)}>
                            <Unlock className="mr-1 h-3.5 w-3.5" />
                            Mở khoá
                          </Button>
                        )}
                      </Can>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Phân trang */}
        <div className="mt-4 flex items-center justify-between border-t pt-4 dark:border-gray-800">
          <p className="text-sm text-muted-foreground">
            Trang {data?.page ?? page}/{totalPages} · {data?.total_count ?? 0} người dùng
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm">
              {page}
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </QueryState>

      {/* Dialog khoá tài khoản — bắt buộc nhập lý do */}
      <Dialog
        open={!!lockTarget}
        onOpenChange={(open) => {
          if (!open) {
            setLockTarget(null);
            setLockReason("");
          }
        }}
      >
        <DialogContent>
          <DialogTitle>Khoá tài khoản &quot;{lockTarget?.email}&quot;?</DialogTitle>
          <DialogDescription>
            Tài khoản sẽ bị đăng xuất khỏi TẤT CẢ thiết bị ngay lập tức. Vui lòng nhập lý do khoá (bắt buộc).
          </DialogDescription>
          <div className="mt-2">
            <label htmlFor="lock-reason" className="mb-1 block text-sm font-medium text-foreground">
              Lý do khoá <span className="text-red-600">*</span>
            </label>
            <textarea
              id="lock-reason"
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Ví dụ: Vi phạm điều khoản sử dụng"
              className="w-full rounded-xl border border-slate-200 bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-border"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{lockReason.length}/500</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockTarget(null)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              disabled={!lockReason.trim() || updateStatus.isPending}
              isLoading={updateStatus.isPending}
              onClick={submitLock}
            >
              Khoá tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog mở khoá — xác nhận ngắn, không cần lý do */}
      <Dialog open={!!unlockTarget} onOpenChange={(open) => !open && setUnlockTarget(null)}>
        <DialogContent>
          <DialogTitle>Mở khoá tài khoản &quot;{unlockTarget?.email}&quot;?</DialogTitle>
          <DialogDescription>Người dùng sẽ đăng nhập lại được ngay sau khi mở khoá.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlockTarget(null)}>
              Huỷ
            </Button>
            <Button isLoading={updateStatus.isPending} onClick={submitUnlock}>
              Mở khoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
