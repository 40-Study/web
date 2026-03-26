"use client";

import { useMemo, useState } from "react";
import {
  useSystemRoles,
  usePermissions,
  useCreateSystemRole,
  useUpdateSystemRole,
  useDeleteSystemRole,
} from "@/hooks/queries/use-admin";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";

type RoleFormState = {
  id?: string;
  name: string;
  description: string;
  permissions: string[];
};

const emptyForm: RoleFormState = { name: "", description: "", permissions: [] };

export default function RolesPage() {
  const { data: rolesData = [], isLoading: rolesLoading } = useSystemRoles();
  const { data: permsData = [] } = usePermissions();
  const createRole = useCreateSystemRole();
  const updateRole = useUpdateSystemRole();
  const deleteRole = useDeleteSystemRole();

  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedRole = useMemo(
    () => rolesData.find((item) => item.id === selectedId) || null,
    [rolesData, selectedId]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.permissions.length === 0) return;

    const payload = {
      name: form.name,
      description: form.description || undefined,
      permissions: form.permissions,
    };

    if (form.id) {
      updateRole.mutate({ roleId: form.id, data: payload });
    } else {
      createRole.mutate(payload);
    }

    setForm(emptyForm);
  };

  const togglePermission = (perm: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((item) => item !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const startEdit = (role: (typeof rolesData)[number]) => {
    const rolePermissions = Array.isArray(role.permissions) ? role.permissions : [];
    setForm({
      id: role.id,
      name: role.name,
      description: role.description || "",
      permissions: rolePermissions,
    });
  };

  const resetForm = () => setForm(emptyForm);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý vai trò</h1>
        <p className="mt-1 text-sm text-gray-500">CRUD đầy đủ: tạo, xem chi tiết, cập nhật, xóa vai trò hệ thống.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-3">
          {rolesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />
              ))}
            </div>
          ) : (
            rolesData.map((role) => {
              const rolePermissions = Array.isArray(role.permissions) ? role.permissions : [];
              const active = selectedRole?.id === role.id;

              return (
                <div
                  key={role.id}
                  className={`rounded-lg bg-white p-4 shadow-sm ${active ? "ring-2 ring-primary-200" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button className="text-left" onClick={() => setSelectedId(role.id)}>
                      <h3 className="font-medium text-gray-900">{role.name}</h3>
                      <p className="text-xs text-gray-500">{role.description || "Không có mô tả"}</p>
                    </button>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {role.user_count || 0} users
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {rolePermissions.slice(0, 4).map((perm) => (
                      <span key={perm} className="rounded bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
                        {perm}
                      </span>
                    ))}
                  </div>
                  <Can permission={PERMISSIONS.MANAGE_ROLES}>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => startEdit(role)}
                        className="rounded bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => deleteRole.mutate(role.id)}
                        className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                      >
                        Xóa
                      </button>
                    </div>
                  </Can>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <Can permission={PERMISSIONS.MANAGE_ROLES}>
            <form onSubmit={onSubmit} className="rounded-lg bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                {form.id ? "Cập nhật vai trò" : "Tạo vai trò mới"}
              </h2>
              <div className="mt-3 space-y-2">
                <input
                  placeholder="Tên vai trò"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-10 w-full rounded border border-gray-200 px-3 text-sm"
                />
                <input
                  placeholder="Mô tả"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="h-10 w-full rounded border border-gray-200 px-3 text-sm"
                />
                <div className="max-h-48 space-y-1 overflow-auto rounded border border-gray-200 p-2">
                  {permsData.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(perm.name)}
                        onChange={() => togglePermission(perm.name)}
                      />
                      <span>{perm.name}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="rounded bg-primary-600 px-3 py-2 text-sm font-medium text-white">
                    {form.id ? "Lưu" : "Tạo"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded bg-gray-100 px-3 py-2 text-sm font-medium"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </form>
          </Can>

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Chi tiết vai trò</h2>
            {selectedRole ? (
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="text-gray-500">Tên:</span> {selectedRole.name}</p>
                <p><span className="text-gray-500">Mô tả:</span> {selectedRole.description || "-"}</p>
                <p><span className="text-gray-500">Users:</span> {selectedRole.user_count || 0}</p>
                <div>
                  <p className="text-gray-500">Permissions:</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(Array.isArray(selectedRole.permissions) ? selectedRole.permissions : []).map((perm) => (
                      <span key={perm} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Chọn một vai trò để xem chi tiết.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
