"use client";

import { useEffect, useMemo, useState } from "react";
import { usePermissions, useUpdatePermission } from "@/hooks/queries/use-admin";
import { QueryState } from "@/components/common/query-state";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";

type PermissionState = {
  id: string;
  name: string;
  description?: string;
  category?: string;
};

// A-P1-3: backend (permission_router.go) chỉ có GET / , GET /:id, PUT /:id — KHÔNG có
// POST/DELETE. Trước đây trang có nút "Tạo"/"Xóa" nhưng chỉ setState cục bộ, không gọi API
// nào — dữ liệu biến mất khi reload. Đã bỏ hẳn, chỉ giữ "Sửa mô tả" nối vào PUT /permissions/:id
// (API thật, có gate ROLES_MANAGE_SYSTEM ở backend).
type PermissionForm = {
  id: string;
  description: string;
};

export default function AdminPermissionsPage() {
  const { data: permissions = [], isLoading, isError, refetch } = usePermissions();
  const updatePermission = useUpdatePermission();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<PermissionForm | null>(null);

  useEffect(() => {
    if (permissions.length > 0 && !selectedId) {
      setSelectedId(permissions[0].id);
    }
  }, [permissions, selectedId]);

  const grouped = useMemo(() => {
    return permissions.reduce<Record<string, PermissionState[]>>((acc, perm) => {
      const key = perm.category || "Khác";
      if (!acc[key]) acc[key] = [];
      acc[key].push(perm);
      return acc;
    }, {});
  }, [permissions]);

  const selected = useMemo(
    () => permissions.find((item) => item.id === selectedId) || null,
    [permissions, selectedId]
  );

  const startEdit = (item: PermissionState) => {
    setForm({ id: item.id, description: item.description || "" });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    updatePermission.mutate(
      { id: form.id, description: form.description },
      { onSuccess: () => setForm(null) }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Phân quyền hệ thống</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Danh sách quyền theo module — chỉ xem và sửa mô tả. Backend hiện chưa có API tạo/xoá
          quyền (chỉ GET và PUT /permissions/:id), nên trang này không hiển thị nút Tạo/Xoá.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-4">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={Object.keys(grouped).length === 0}
            emptyTitle="Chưa có quyền nào"
            onRetry={() => refetch()}
          >
            {Object.entries(grouped).map(([category, items]) => (
              <section key={category} className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{category}</h2>
                <div className="mt-3 space-y-2">
                  {items.map((perm) => (
                    <div
                      key={perm.id}
                      className={`rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800 ${selected?.id === perm.id ? "ring-2 ring-primary-200" : ""}`}
                    >
                      <button className="w-full text-left" onClick={() => setSelectedId(perm.id)}>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{perm.name}</p>
                        <p className="text-xs text-gray-500">{perm.description || "Không có mô tả"}</p>
                      </button>
                      <Can permission={PERMISSIONS.MANAGE_ROLES}>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => startEdit(perm)}
                            className="rounded bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
                          >
                            Sửa mô tả
                          </button>
                        </div>
                      </Can>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </QueryState>
        </div>

        <div className="space-y-4">
          <Can permission={PERMISSIONS.MANAGE_ROLES}>
            {form && (
              <form onSubmit={onSubmit} className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Sửa mô tả quyền</h2>
                <div className="mt-3 space-y-2">
                  <textarea
                    placeholder="Mô tả"
                    value={form.description}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                    className="h-24 w-full rounded border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={updatePermission.isPending}
                      className="rounded bg-primary-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(null)}
                      className="rounded bg-gray-100 px-3 py-2 text-sm font-medium dark:bg-gray-800"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </form>
            )}
          </Can>

          <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Chi tiết quyền</h2>
            {selected ? (
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="text-gray-500">ID:</span> {selected.id}</p>
                <p><span className="text-gray-500">Tên:</span> {selected.name}</p>
                <p><span className="text-gray-500">Mô tả:</span> {selected.description || "-"}</p>
                <p><span className="text-gray-500">Danh mục:</span> {selected.category}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Chọn một quyền để xem chi tiết.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
