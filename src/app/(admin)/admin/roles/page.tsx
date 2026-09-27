"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useSystemRolesWithUserCounts,
  usePermissions,
  useCreateSystemRole,
  useUpdateSystemRole,
  useDeleteSystemRole,
  useSystemRoleUsers,
  useSystemRolePermissions,
  useSetSystemRolePermissions,
  useAssignSystemRoleToUser,
  useRevokeSystemRoleFromUser,
} from "@/hooks/queries/use-admin";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { getSystemRoleLabel } from "@/lib/role-labels";
import type { SystemRole, UserSystemRoleItem } from "@/services/role.service";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";

type RoleFormState = {
  id?: string;
  name: string;
  description: string;
  // Tên (name) các quyền đã tick — khớp field permsData[].name, đổi sang permission_id khi gửi API.
  permissions: string[];
};

const emptyRoleForm: RoleFormState = { name: "", description: "", permissions: [] };

const USER_STATUS_LABEL: Record<UserSystemRoleItem["status"], string> = {
  active: "Đang hoạt động",
  suspended: "Tạm ngưng",
  revoked: "Đã gỡ",
};

const formatDate = (iso: string) => new Date(iso).toLocaleString("vi-VN");

export default function RolesPage() {
  const { roles: rolesWithCounts, isLoading: rolesLoading } = useSystemRolesWithUserCounts();
  const { data: permsData = [] } = usePermissions();
  const createRole = useCreateSystemRole();
  const updateRole = useUpdateSystemRole();
  const deleteRole = useDeleteSystemRole();
  const setRolePermissions = useSetSystemRolePermissions();

  const [roleForm, setRoleForm] = useState<RoleFormState>(emptyRoleForm);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  // Xác nhận trước khi xóa (H-09) — xóa role/gỡ user không còn kích hoạt mutation ngay khi click.
  const [confirmDeleteRole, setConfirmDeleteRole] = useState<SystemRole | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<UserSystemRoleItem | null>(null);

  // A-P1-1: không còn seedUsersForRole giả — gán vai trò cho user THẬT theo user_id (UUID).
  // Chưa có API tìm-user-theo-tên/email (xem A-P1-6 trong báo cáo QA) nên admin phải biết UUID.
  const [assignUserId, setAssignUserId] = useState("");

  useEffect(() => {
    setSelectedRoleId((prev) => prev || rolesWithCounts[0]?.id || null);
  }, [rolesWithCounts]);

  const selectedRole = useMemo(
    () => rolesWithCounts.find((item) => item.id === selectedRoleId) || null,
    [rolesWithCounts, selectedRoleId]
  );

  const {
    data: roleUsersPage,
    isLoading: usersLoading,
    isError: usersError,
  } = useSystemRoleUsers(selectedRoleId);
  const roleUsers = roleUsersPage?.user_system_roles ?? [];

  const assignUser = useAssignSystemRoleToUser();
  const revokeUser = useRevokeSystemRoleFromUser();

  // A-P1-2: nạp lại đúng quyền hiện có của role khi mở "Sửa role" (trước đây luôn set []).
  const { data: editingRolePermissions } = useSystemRolePermissions(roleForm.id ?? null);
  useEffect(() => {
    if (roleForm.id && editingRolePermissions) {
      setRoleForm((prev) =>
        prev.id === roleForm.id ? { ...prev, permissions: editingRolePermissions.map((p) => p.name) } : prev
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleForm.id, editingRolePermissions]);

  const submitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name) return;

    const payload = {
      name: roleForm.name,
      description: roleForm.description || undefined,
    };
    const permissionIds = permsData
      .filter((perm) => roleForm.permissions.includes(perm.name))
      .map((perm) => perm.id);

    if (roleForm.id) {
      // Sửa role: PUT thông tin + PUT permissions (replace toàn bộ, kể cả khi bỏ tick hết).
      await updateRole.mutateAsync({ roleId: roleForm.id, data: payload });
      await setRolePermissions.mutateAsync({ roleId: roleForm.id, permissionIds });
    } else {
      // Tạo role: chỉ gọi thêm API gán quyền nếu có tick — tránh 1 request rỗng vô ích.
      const created = await createRole.mutateAsync(payload);
      if (permissionIds.length > 0) {
        await setRolePermissions.mutateAsync({ roleId: created.id, permissionIds });
      }
    }

    setRoleForm(emptyRoleForm);
  };

  const togglePermission = (perm: string) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((item) => item !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const startEditRole = (role: SystemRole) => {
    // permissions để [] tạm thời — useEffect ở trên sẽ nạp lại quyền THẬT của role này khi
    // useSystemRolePermissions(role.id) trả dữ liệu.
    setRoleForm({ id: role.id, name: role.name, description: role.description || "", permissions: [] });
  };

  const removeRole = (roleId: string) => {
    deleteRole.mutate(roleId);
    if (selectedRoleId === roleId) setSelectedRoleId(null);
  };

  const submitAssignUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleId || !assignUserId.trim()) return;
    assignUser.mutate(
      { userId: assignUserId.trim(), roleId: selectedRoleId },
      { onSuccess: () => setAssignUserId("") }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý vai trò & user</h1>
        <p className="mt-1 text-sm text-gray-500">
          Số user và danh sách bên dưới lấy từ dữ liệu thật (GET /system-roles/:id/users). API chưa
          trả tên/email user — chỉ có User ID, trạng thái và thời gian gán.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-3">
          {rolesLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />)}</div>
          ) : (
            rolesWithCounts.map((role) => {
              const active = selectedRole?.id === role.id;

              return (
                <div key={role.id} className={`rounded-lg bg-white p-4 shadow-sm ${active ? "ring-2 ring-primary-200" : ""}`}>
                  <button className="w-full text-left" onClick={() => setSelectedRoleId(role.id)}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 className="font-medium text-gray-900">{getSystemRoleLabel(role.name)}</h3>
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">{role.name}</span>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                          role.userCountError ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                        }`}
                        title={role.userCountError ? "Không tải được số user (thiếu quyền hoặc lỗi API)" : undefined}
                      >
                        {role.userCountError ? "lỗi" : role.userCount === null ? "…" : `${role.userCount} user`}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{role.description || "Không có mô tả"}</p>
                  </button>

                  <Can permission={PERMISSIONS.MANAGE_ROLES}>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEditRole(role)}>
                        Sửa role
                      </Button>
                      <Button size="sm" variant="destructiveGhost" onClick={() => setConfirmDeleteRole(role)}>
                        Xóa role
                      </Button>
                    </div>
                  </Can>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <Can permission={PERMISSIONS.MANAGE_ROLES}>
            <form onSubmit={submitRole} className="rounded-lg bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">{roleForm.id ? "Cập nhật vai trò" : "Tạo vai trò mới"}</h2>
              <div className="mt-3 space-y-2">
                <input placeholder="Tên vai trò" value={roleForm.name} onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))} className="h-10 w-full rounded border border-gray-200 px-3 text-sm" />
                <input placeholder="Mô tả" value={roleForm.description} onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))} className="h-10 w-full rounded border border-gray-200 px-3 text-sm" />
                <div className="max-h-32 space-y-1 overflow-auto rounded border border-gray-200 p-2">
                  {permsData.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={roleForm.permissions.includes(perm.name)} onChange={() => togglePermission(perm.name)} />
                      <span>{perm.name}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={updateRole.isPending || createRole.isPending || setRolePermissions.isPending}
                    className="rounded bg-primary-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {roleForm.id ? "Lưu role" : "Tạo role"}
                  </button>
                  <button type="button" onClick={() => setRoleForm(emptyRoleForm)} className="rounded bg-gray-100 px-3 py-2 text-sm font-medium">Reset</button>
                </div>
              </div>
            </form>
          </Can>

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              User theo vai trò{roleUsersPage ? ` — tổng ${roleUsersPage.total}` : ""}
            </h2>
            {selectedRole ? (
              <div className="mt-3 space-y-3">
                {usersLoading ? (
                  <p className="text-xs text-gray-500">Đang tải…</p>
                ) : usersError ? (
                  <p className="text-xs text-red-600">Không tải được danh sách user.</p>
                ) : roleUsers.length === 0 ? (
                  <p className="text-xs text-gray-500">Chưa có user nào được gán vai trò này.</p>
                ) : (
                  <div className="space-y-2">
                    {roleUsers.map((u) => (
                      <div key={u.id} className="rounded border border-gray-100 p-2">
                        <p className="break-all font-mono text-xs text-gray-900">{u.user_id}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {USER_STATUS_LABEL[u.status] ?? u.status} · Gán lúc {formatDate(u.granted_at)}
                        </p>
                        <Can permission={PERMISSIONS.MANAGE_ROLES}>
                          <div className="mt-2">
                            <Button size="sm" variant="destructiveGhost" onClick={() => setConfirmRevoke(u)}>
                              Gỡ vai trò
                            </Button>
                          </div>
                        </Can>
                      </div>
                    ))}
                  </div>
                )}

                <Can permission={PERMISSIONS.MANAGE_ROLES}>
                  <form onSubmit={submitAssignUser} className="space-y-2 rounded border border-gray-200 p-2">
                    <label className="block text-xs font-medium text-gray-700">
                      Gán vai trò cho user (User ID)
                    </label>
                    <input
                      placeholder="UUID của user"
                      value={assignUserId}
                      onChange={(e) => setAssignUserId(e.target.value)}
                      className="h-9 w-full rounded border border-gray-200 px-2 font-mono text-xs"
                    />
                    <p className="text-[11px] text-gray-400">
                      Hệ thống chưa có API tìm user theo tên/email — cần biết UUID (xem trang chi
                      tiết user hoặc DB).
                    </p>
                    <button
                      type="submit"
                      disabled={assignUser.isPending}
                      className="rounded bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                    >
                      Gán vai trò
                    </button>
                  </form>
                </Can>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Chọn một vai trò để quản lý user.</p>
            )}
          </div>
        </div>
      </div>

      {/* Xác nhận xóa role (H-09) */}
      <Dialog open={!!confirmDeleteRole} onOpenChange={(open) => !open && setConfirmDeleteRole(null)}>
        <DialogContent>
          <DialogTitle>Xóa vai trò &quot;{confirmDeleteRole?.name}&quot;?</DialogTitle>
          <DialogDescription>
            Hành động này không thể hoàn tác. Toàn bộ user đang gán cho vai trò này sẽ mất liên kết.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteRole(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDeleteRole) removeRole(confirmDeleteRole.id);
                setConfirmDeleteRole(null);
              }}
            >
              Xóa vai trò
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Xác nhận gỡ vai trò khỏi user (H-09) */}
      <Dialog open={!!confirmRevoke} onOpenChange={(open) => !open && setConfirmRevoke(null)}>
        <DialogContent>
          <DialogTitle>Gỡ vai trò khỏi user này?</DialogTitle>
          <DialogDescription className="break-all">
            User ID: {confirmRevoke?.user_id}. Hành động này không thể hoàn tác.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRevoke(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmRevoke && selectedRoleId) {
                  revokeUser.mutate({ userId: confirmRevoke.user_id, roleId: selectedRoleId });
                }
                setConfirmRevoke(null);
              }}
            >
              Gỡ vai trò
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
