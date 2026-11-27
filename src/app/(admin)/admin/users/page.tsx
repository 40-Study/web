"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ChevronsUpDown, Lock, Unlock } from "lucide-react";

import { useAdminUsers, useUpdateUserStatus } from "@/hooks/queries/use-admin-users";
import { useSystemRoles } from "@/hooks/queries/use-admin";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { getSystemRoleLabel } from "@/lib/role-labels";
import { useAuthStore } from "@/stores/auth.store";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  RESTORE_ACTION_LABEL,
  getUserStatusLabel,
  getUserStatusVariant,
  isSelfDeleted,
} from "../_lib/user-status-label";
import { parseRoleParam } from "../_lib/role-param";
import { nextSort, sortAdminUsers, type SortDirection, type UserSortKey } from "../_lib/user-sort";
import type { AdminUserListItem, AdminUserStatusFilter } from "@/types/user";
import { QueryState } from "@/components/common/query-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatVnDateTime } from "@/lib/vn-datetime";
import { PIN_BELOW_SM_AND_FROM_2XL } from "../_lib/sticky-action-column";

const LIMIT = 20;

// QA-C-12: cùng định dạng ngày giờ VN với các màn admin khác ("10:00 28/09/2026"), không còn giây và ngày không số 0.
const formatDate = (iso: string | null) => formatVnDateTime(iso);

function parsePageParam(raw: string | null): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function parseStatusParam(raw: string | null): "ALL" | AdminUserStatusFilter {
  return raw === "active" || raw === "locked" ? raw : "ALL";
}

type SortState = { key: UserSortKey | null; direction: SortDirection };

function ariaSortOf(sort: SortState, keys: UserSortKey[]) {
  const active = sort.key !== null && keys.includes(sort.key);
  return !active ? "none" : sort.direction === "asc" ? "ascending" : "descending";
}

function SortButton({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: UserSortKey;
  sort: SortState;
  onSort: (key: UserSortKey) => void;
}) {
  const active = sort.key === sortKey;
  const Icon = !active ? ChevronsUpDown : sort.direction === "asc" ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      title="Sắp xếp trong trang đang xem"
      className="inline-flex items-center gap-1 whitespace-nowrap font-medium hover:text-foreground"
    >
      {label}
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: UserSortKey;
  sort: SortState;
  onSort: (key: UserSortKey) => void;
}) {
  return (
    <TableHead aria-sort={ariaSortOf(sort, [sortKey])}>
      <SortButton label={label} sortKey={sortKey} sort={sort} onSort={onSort} />
    </TableHead>
  );
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
  const [rawRoleFilter, setRoleFilter] = useState(() => searchParams.get("role") ?? "ALL");
  // QA6-A11: danh sách vai trò tải bất đồng bộ nên `?role=` chỉ kiểm được sau khi có danh sách; trước đó giữ nguyên giá trị URL.
  // QA7 #134 L-4: tải danh sách vai trò THẤT BẠI thì `?role=` không bao giờ kiểm được; coi như vai trò lạ (về "Tất cả")
  // thay vì gửi một giá trị chưa kiểm lên API. (Ô chọn vai trò cũng không có lựa chọn nào khi danh sách lỗi.)
  const { data: systemRoles = [], isSuccess: rolesLoaded, isPending: rolesPending, isError: rolesFailed } = useSystemRoles();
  const roleFilter = rolesLoaded
    ? parseRoleParam(rawRoleFilter, systemRoles.map((role) => role.name))
    : rolesFailed
      ? "ALL"
      : rawRoleFilter;
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

  // Q6 #132 L6: `?role=nope` từng bị gửi lên API một lần trước khi danh sách vai trò về. Có `?role=` khác "Tất cả" thì chờ
  // danh sách vai trò (thành công hoặc lỗi) rồi mới tải; trong lúc chờ bảng hiện trạng thái đang tải như bình thường.
  const waitingForRoles = rawRoleFilter !== "ALL" && rolesPending;
  const usersQuery = useAdminUsers(params, { enabled: !waitingForRoles });
  const { data, isError, error, refetch } = usersQuery;
  const isLoading = usersQuery.isLoading || waitingForRoles;
  const updateStatus = useUpdateUserStatus();

  // ADM-L2: backend chưa có tham số sort -> sắp xếp trong trang đang xem (xem _lib/user-sort.ts).
  const [sort, setSort] = useState<{ key: UserSortKey | null; direction: SortDirection }>({ key: null, direction: "asc" });
  const items = useMemo(() => sortAdminUsers(data?.items ?? [], sort.key, sort.direction), [data, sort]);
  const totalPages = data?.total_pages ?? 1;

  // QA3-15: ?page=999 vượt trang cuối cho danh sách rỗng và không có đường quay lại. Khi server báo số
  // trang thật (>= 1) mà page đang xin lớn hơn thì kéo về trang cuối; URL tự cập nhật theo qua effect trên.
  useEffect(() => {
    const lastPage = data?.total_pages;
    if (lastPage && lastPage >= 1 && page > lastPage) setPage(lastPage);
  }, [data?.total_pages, page]);

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
      await updateStatus.mutateAsync({
        id: unlockTarget.id,
        data: { is_active: true },
        ...(isSelfDeleted(unlockTarget) ? { restore: true } : {}),
      });
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
          aria-label="Tìm người dùng"
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
        hasData={items.length > 0}
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
                <SortableHead label="Email" sortKey="email" sort={sort} onSort={(k) => setSort((s) => nextSort(s, k))} />
                <SortableHead label="Tên" sortKey="name" sort={sort} onSort={(k) => setSort((s) => nextSort(s, k))} />
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                {/* QA8-A02: "Ngày tạo" và "Đăng nhập cuối" gộp một cột (hai dòng xếp chồng) để bảng vừa khung 942px
                    ở 1280px; vẫn sắp xếp được theo từng mốc (aria-sort báo mốc đang sắp). */}
                <TableHead aria-sort={ariaSortOf(sort, ["created_at", "last_login_at"])}>
                  <div className="flex flex-col items-start gap-0.5">
                    <SortButton label="Ngày tạo" sortKey="created_at" sort={sort} onSort={(k) => setSort((s) => nextSort(s, k))} />
                    <SortButton label="Đăng nhập cuối" sortKey="last_login_at" sort={sort} onSort={(k) => setSort((s) => nextSort(s, k))} />
                  </div>
                </TableHead>
                {/* A7 (mobile 390px): bảng rộng hơn màn hình nên cột hành động bị đẩy khỏi tầm
                    nhìn, không có dấu hiệu cuộn. Ghim cột này vào mép phải để nút Khoá/Mở khoá
                    luôn tới được. Nền đục để hàng không lộ qua khi cuộn ngang. QA7-A01: xem PIN_BELOW_SM_AND_FROM_2XL. */}
                <TableHead className={`${PIN_BELOW_SM_AND_FROM_2XL} bg-gray-50 text-right dark:bg-gray-900`}>
                  Hành động
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((user) => {
                const isSelf = !!currentUserId && user.id === currentUserId;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      {/* QA8-A02: email dài bị cắt (đủ chữ ở title) để không đẩy bảng rộng hơn khung. */}
                      <Link
                        href={`/admin/users/${user.id}`}
                        title={user.email}
                        className="block max-w-[14rem] truncate font-medium text-primary-700 hover:underline"
                      >
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
                            <Badge key={role} variant="outline" className="whitespace-nowrap">
                              {getSystemRoleLabel(role)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getUserStatusVariant(user)} className="whitespace-nowrap">
                        {getUserStatusLabel(user)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      <div title="Ngày tạo">
                        <span className="sr-only">Ngày tạo: </span>
                        {formatDate(user.created_at)}
                      </div>
                      <div title="Đăng nhập cuối">
                        <span className="sr-only">Đăng nhập cuối: </span>
                        {formatDate(user.last_login_at)}
                      </div>
                    </TableCell>
                    <TableCell className={`${PIN_BELOW_SM_AND_FROM_2XL} bg-white text-right dark:bg-gray-950`}>
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
                          <Button
                            size="sm"
                            variant="outline"
                            title={isSelfDeleted(user) ? `${RESTORE_ACTION_LABEL} (người dùng tự xoá)` : undefined}
                            onClick={() => setUnlockTarget(user)}
                          >
                            <Unlock className="mr-1 h-3.5 w-3.5" />
                            {isSelfDeleted(user) ? "Khôi phục" : "Mở khoá"}
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
            <Button
              variant="outline"
              size="sm"
              aria-label="Trang trước"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            {/* QA6-A07: trang hiện tại là nhãn, không phải nút bấm không làm gì. */}
            <span aria-current="page" className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
              {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              aria-label="Trang sau"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
          <DialogTitle>
            {unlockTarget && isSelfDeleted(unlockTarget) ? RESTORE_ACTION_LABEL : "Mở khoá tài khoản"} &quot;
            {unlockTarget?.email}&quot;?
          </DialogTitle>
          <DialogDescription>
            {unlockTarget && isSelfDeleted(unlockTarget)
              ? "Người dùng đã tự xoá tài khoản này, không phải bị khoá. Khôi phục sẽ cho họ đăng nhập lại ngay."
              : "Người dùng sẽ đăng nhập lại được ngay sau khi mở khoá."}
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlockTarget(null)}>
              Huỷ
            </Button>
            <Button isLoading={updateStatus.isPending} onClick={submitUnlock}>
              {unlockTarget && isSelfDeleted(unlockTarget) ? "Khôi phục" : "Mở khoá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
