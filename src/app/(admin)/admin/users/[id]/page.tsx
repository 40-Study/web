"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, Unlock } from "lucide-react";

import {
  useAdminUserDetail,
  useAssignUserSystemRole,
  useRevokeUserSystemRole,
  useUpdateUserStatus,
} from "@/hooks/queries/use-admin-users";
import { useSystemRoles } from "@/hooks/queries/use-admin";
import { Can } from "@/components/guards";
import { PERMISSIONS, SYSTEM_ROLES } from "@/lib/permissions";
import { getSystemRoleLabel } from "@/lib/role-labels";
import { useAuthStore } from "@/stores/auth.store";
import { QueryState } from "@/components/common/query-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString("vi-VN") : "—";
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2 last:border-0 dark:border-gray-800">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: user, isLoading, isError, error, refetch } = useAdminUserDetail(userId);
  const { data: systemRoles = [] } = useSystemRoles();

  const updateStatus = useUpdateUserStatus();
  const assignRole = useAssignUserSystemRole();
  const revokeRole = useRevokeUserSystemRole();

  const [lockOpen, setLockOpen] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState("");

  const isSelf = !!currentUserId && !!user && user.id === currentUserId;
  // Vai trò chưa gán — nguồn cho dropdown "+ Thêm vai trò".
  const assignedRoleNames = useMemo(
    () => new Set((user?.system_roles ?? []).map((r) => r.name)),
    [user]
  );
  const availableRoles = useMemo(
    () => systemRoles.filter((r) => !assignedRoleNames.has(r.name)),
    [systemRoles, assignedRoleNames]
  );
  // Không cho gỡ vai trò cuối cùng — user sẽ mồ côi quyền (backend chưa chặn, xem báo cáo).
  const onlyOneRoleLeft = (user?.system_roles.length ?? 0) <= 1;

  const submitLock = async () => {
    const reason = lockReason.trim();
    if (!reason) return;
    try {
      await updateStatus.mutateAsync({ id: userId, data: { is_active: false, reason } });
      setLockOpen(false);
      setLockReason("");
    } catch {
      // Lỗi đã hiển thị qua toast trong hook.
    }
  };

  const submitUnlock = async () => {
    try {
      await updateStatus.mutateAsync({ id: userId, data: { is_active: true } });
      setUnlockOpen(false);
    } catch {
      // Lỗi đã hiển thị qua toast trong hook.
    }
  };

  const submitAssignRole = () => {
    if (!selectedNewRole) return;
    assignRole.mutate(
      { userId, systemRoleId: selectedNewRole },
      { onSuccess: () => setSelectedNewRole("") }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/users")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chi tiết người dùng</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Xem thông tin, khoá/mở khoá và quản lý vai trò hệ thống.
          </p>
        </div>
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
        {user && (
          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {user.full_name || user.user_name}
                    </h2>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <Badge variant={user.is_active ? "success" : "destructive"}>
                    {user.is_active ? "Active" : "Locked"}
                  </Badge>
                </div>

                <div className="mt-4">
                  <DetailRow label="Tên đăng nhập" value={user.user_name} />
                  <DetailRow label="Số điện thoại" value={user.phone || "—"} />
                  <DetailRow label="Ngày sinh" value={user.date_of_birth ? formatDate(user.date_of_birth) : "—"} />
                  <DetailRow label="Đã xác thực" value={user.is_verified ? "Có" : "Chưa"} />
                  <DetailRow label="Ngày tạo" value={formatDate(user.created_at)} />
                  <DetailRow label="Đăng nhập cuối" value={formatDate(user.last_login_at)} />
                  {!user.is_active && (
                    <>
                      <DetailRow label="Lý do khoá" value={user.locked_reason || "—"} />
                      <DetailRow label="Khoá lúc" value={formatDate(user.locked_at)} />
                    </>
                  )}
                </div>

                <Can permission={PERMISSIONS.USERS_BAN}>
                  <div className="mt-4">
                    {user.is_active ? (
                      <Button
                        variant="destructiveGhost"
                        disabled={isSelf}
                        title={isSelf ? "Không thể tự khoá tài khoản của chính mình" : undefined}
                        onClick={() => setLockOpen(true)}
                      >
                        <Lock className="mr-1 h-4 w-4" />
                        Khoá tài khoản
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => setUnlockOpen(true)}>
                        <Unlock className="mr-1 h-4 w-4" />
                        Mở khoá tài khoản
                      </Button>
                    )}
                  </div>
                </Can>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Vai trò hệ thống</h3>

                <div className="mt-3 space-y-2">
                  {user.system_roles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có vai trò nào.</p>
                  ) : (
                    user.system_roles.map((role) => {
                      // Không tự hạ quyền: chặn tự gỡ SYSTEM_ADMIN của chính mình.
                      const blockSelfDemote = isSelf && role.name === SYSTEM_ROLES.SYSTEM_ADMIN;
                      const disableRevoke = onlyOneRoleLeft || blockSelfDemote;
                      const reason = onlyOneRoleLeft
                        ? "Không thể gỡ vai trò cuối cùng của người dùng"
                        : blockSelfDemote
                          ? "Không thể tự gỡ quyền quản trị hệ thống của chính mình"
                          : undefined;

                      return (
                        <div
                          key={role.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {getSystemRoleLabel(role.name)}
                            </p>
                            <p className="text-xs text-muted-foreground">Gán lúc {formatDate(role.granted_at)}</p>
                          </div>
                          <Can permission={PERMISSIONS.MANAGE_ROLES}>
                            <Button
                              size="sm"
                              variant="destructiveGhost"
                              disabled={disableRevoke || revokeRole.isPending}
                              title={reason}
                              onClick={() => revokeRole.mutate({ userId, systemRoleId: role.id })}
                            >
                              Gỡ
                            </Button>
                          </Can>
                        </div>
                      );
                    })
                  )}
                </div>

                <Can permission={PERMISSIONS.MANAGE_ROLES}>
                  {availableRoles.length > 0 && (
                    <div className="mt-4 flex items-center gap-2">
                      <Select value={selectedNewRole} onValueChange={setSelectedNewRole}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="+ Thêm vai trò" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {getSystemRoleLabel(role.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        disabled={!selectedNewRole || assignRole.isPending}
                        isLoading={assignRole.isPending}
                        onClick={submitAssignRole}
                      >
                        Thêm
                      </Button>
                    </div>
                  )}
                </Can>
              </div>
            </div>
          </div>
        )}
      </QueryState>

      {/* Dialog khoá tài khoản — bắt buộc nhập lý do */}
      <Dialog
        open={lockOpen}
        onOpenChange={(open) => {
          setLockOpen(open);
          if (!open) setLockReason("");
        }}
      >
        <DialogContent>
          <DialogTitle>Khoá tài khoản &quot;{user?.email}&quot;?</DialogTitle>
          <DialogDescription>
            Tài khoản sẽ bị đăng xuất khỏi TẤT CẢ thiết bị ngay lập tức. Vui lòng nhập lý do khoá (bắt buộc).
          </DialogDescription>
          <div className="mt-2">
            <label htmlFor="lock-reason-detail" className="mb-1 block text-sm font-medium text-foreground">
              Lý do khoá <span className="text-red-600">*</span>
            </label>
            <textarea
              id="lock-reason-detail"
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
            <Button variant="outline" onClick={() => setLockOpen(false)}>
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
      <Dialog open={unlockOpen} onOpenChange={setUnlockOpen}>
        <DialogContent>
          <DialogTitle>Mở khoá tài khoản &quot;{user?.email}&quot;?</DialogTitle>
          <DialogDescription>Người dùng sẽ đăng nhập lại được ngay sau khi mở khoá.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlockOpen(false)}>
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
