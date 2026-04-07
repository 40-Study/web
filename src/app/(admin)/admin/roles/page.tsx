"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useSystemRoles,
  usePermissions,
  useCreateSystemRole,
  useUpdateSystemRole,
  useDeleteSystemRole,
} from "@/hooks/queries/use-admin";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";
import type { SystemRole } from "@/services/role.service";

type RoleFormState = {
  id?: string;
  name: string;
  description: string;
  permissions: string[];
};

type RoleUser = {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
};

type UserFormState = {
  id?: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
};

const emptyRoleForm: RoleFormState = { name: "", description: "", permissions: [] };
const emptyUserForm: UserFormState = { name: "", email: "", status: "ACTIVE" };

function seedUsersForRole(role: SystemRole): RoleUser[] {
  const count = Math.max(1, Math.min(3, 5));
  return Array.from({ length: count }).map((_, index) => {
    const order = index + 1;
    const slug = role.name.toLowerCase().replace(/\s+/g, "-");
    return {
      id: `${role.id}-user-${order}`,
      name: `${role.name} User ${order}`,
      email: `${slug}.${order}@fortex.vn`,
      status: order % 2 === 0 ? "INACTIVE" : "ACTIVE",
    };
  });
}

export default function RolesPage() {
  const { data: rolesData = [], isLoading: rolesLoading } = useSystemRoles();
  const { data: permsData = [] } = usePermissions();
  const createRole = useCreateSystemRole();
  const updateRole = useUpdateSystemRole();
  const deleteRole = useDeleteSystemRole();

  const [roleForm, setRoleForm] = useState<RoleFormState>(emptyRoleForm);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [roleUsersMap, setRoleUsersMap] = useState<Record<string, RoleUser[]>>({});
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (rolesData.length === 0) return;
    setRoleUsersMap((prev) => {
      const next = { ...prev };
      rolesData.forEach((role) => {
        if (!next[role.id]) next[role.id] = seedUsersForRole(role);
      });
      return next;
    });
    setSelectedRoleId((prev) => prev || rolesData[0].id);
  }, [rolesData]);

  const selectedRole = useMemo(
    () => rolesData.find((item) => item.id === selectedRoleId) || null,
    [rolesData, selectedRoleId]
  );

  const selectedRoleUsers = useMemo(
    () => (selectedRoleId ? roleUsersMap[selectedRoleId] || [] : []),
    [roleUsersMap, selectedRoleId]
  );

  const selectedUser = useMemo(
    () => selectedRoleUsers.find((item) => item.id === selectedUserId) || null,
    [selectedRoleUsers, selectedUserId]
  );

  const submitRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name) return;

    const payload = {
      name: roleForm.name,
      description: roleForm.description || undefined,
    };

    if (roleForm.id) updateRole.mutate({ roleId: roleForm.id, data: payload });
    else createRole.mutate(payload);

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
    setRoleForm({
      id: role.id,
      name: role.name,
      description: role.description || "",
      permissions: [],
    });
  };

  const removeRole = (roleId: string) => {
    deleteRole.mutate(roleId);
    setRoleUsersMap((prev) => {
      const next = { ...prev };
      delete next[roleId];
      return next;
    });
    if (selectedRoleId === roleId) {
      setSelectedRoleId(null);
      setSelectedUserId(null);
      setUserForm(emptyUserForm);
    }
  };

  const submitUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleId || !userForm.name || !userForm.email) return;

    const payload: RoleUser = {
      id: userForm.id || `${selectedRoleId}-${Date.now()}`,
      name: userForm.name,
      email: userForm.email,
      status: userForm.status,
    };

    setRoleUsersMap((prev) => {
      const current = prev[selectedRoleId] || [];
      const updated = userForm.id
        ? current.map((item) => (item.id === userForm.id ? payload : item))
        : [payload, ...current];
      return { ...prev, [selectedRoleId]: updated };
    });

    setSelectedUserId(payload.id);
    setUserForm(emptyUserForm);
  };

  const startEditUser = (user: RoleUser) => {
    setUserForm({ id: user.id, name: user.name, email: user.email, status: user.status });
  };

  const removeUser = (userId: string) => {
    if (!selectedRoleId) return;
    setRoleUsersMap((prev) => ({
      ...prev,
      [selectedRoleId]: (prev[selectedRoleId] || []).filter((item) => item.id !== userId),
    }));
    if (selectedUserId === userId) setSelectedUserId(null);
    if (userForm.id === userId) setUserForm(emptyUserForm);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý vai trò & user</h1>
        <p className="mt-1 text-sm text-gray-500">Mỗi vai trò có user riêng, xem chi tiết user và CRUD đầy đủ ngay trong trang vai trò.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-3">
          {rolesLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />)}</div>
          ) : (
            rolesData.map((role) => {
              const active = selectedRole?.id === role.id;
              const users = roleUsersMap[role.id] || [];

              return (
                <div key={role.id} className={`rounded-lg bg-white p-4 shadow-sm ${active ? "ring-2 ring-primary-200" : ""}`}>
                  <button className="w-full text-left" onClick={() => { setSelectedRoleId(role.id); setSelectedUserId(null); }}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{role.name}</h3>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">{users.length} users</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{role.description || "Không có mô tả"}</p>
                  </button>

                  <Can permission={PERMISSIONS.MANAGE_ROLES}>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => startEditRole(role)} className="rounded bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">Sửa role</button>
                      <button onClick={() => removeRole(role.id)} className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700">Xóa role</button>
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
                  <button type="submit" className="rounded bg-primary-600 px-3 py-2 text-sm font-medium text-white">{roleForm.id ? "Lưu role" : "Tạo role"}</button>
                  <button type="button" onClick={() => setRoleForm(emptyRoleForm)} className="rounded bg-gray-100 px-3 py-2 text-sm font-medium">Reset</button>
                </div>
              </div>
            </form>
          </Can>

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">User theo vai trò</h2>
            {selectedRole ? (
              <div className="mt-3 space-y-3">
                <div className="space-y-2">
                  {selectedRoleUsers.map((user) => (
                    <div key={user.id} className={`rounded border border-gray-100 p-2 ${selectedUser?.id === user.id ? "ring-2 ring-primary-200" : ""}`}>
                      <button className="w-full text-left" onClick={() => setSelectedUserId(user.id)}>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </button>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => startEditUser(user)} className="rounded bg-primary-100 px-2 py-1 text-xs text-primary-700">Sửa</button>
                        <button onClick={() => removeUser(user.id)} className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">Xóa</button>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={submitUser} className="space-y-2 rounded border border-gray-200 p-2">
                  <input placeholder="Tên user" value={userForm.name} onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))} className="h-9 w-full rounded border border-gray-200 px-2 text-sm" />
                  <input placeholder="Email user" value={userForm.email} onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))} className="h-9 w-full rounded border border-gray-200 px-2 text-sm" />
                  <select value={userForm.status} onChange={(e) => setUserForm((prev) => ({ ...prev, status: e.target.value as RoleUser["status"] }))} className="h-9 w-full rounded border border-gray-200 px-2 text-sm">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="rounded bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white">{userForm.id ? "Lưu user" : "Thêm user"}</button>
                    <button type="button" onClick={() => setUserForm(emptyUserForm)} className="rounded bg-gray-100 px-2.5 py-1.5 text-xs font-medium">Reset</button>
                  </div>
                </form>

                <div className="rounded border border-gray-200 p-2 text-sm">
                  <p className="font-medium text-gray-900">Chi tiết user</p>
                  {selectedUser ? (
                    <div className="mt-2 space-y-1">
                      <p><span className="text-gray-500">Tên:</span> {selectedUser.name}</p>
                      <p><span className="text-gray-500">Email:</span> {selectedUser.email}</p>
                      <p><span className="text-gray-500">Status:</span> {selectedUser.status}</p>
                      <p><span className="text-gray-500">Role:</span> {selectedRole.name}</p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">Chọn user để xem chi tiết.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Chọn một vai trò để quản lý user.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
