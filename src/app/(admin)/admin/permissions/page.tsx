"use client";

import { useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/hooks/queries/use-admin";
import { QueryState } from "@/components/common/query-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";

type PermissionState = {
  id: string;
  name: string;
  description?: string;
  category?: string;
};

type PermissionForm = {
  id?: string;
  name: string;
  description?: string;
  category?: string;
};

const emptyForm: PermissionForm = { name: "", description: "", category: "general" };

export default function AdminPermissionsPage() {
  const { data: permissions = [], isLoading, isError, refetch } = usePermissions();
  const [permissionState, setPermissionState] = useState<PermissionState[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<PermissionForm>(emptyForm);
  // Xác nhận trước khi xóa quyền (đồng nhất với H-09 ở admin/roles)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (permissions.length > 0 && permissionState.length === 0) {
      setPermissionState(permissions);
      setSelectedId(permissions[0].id);
    }
  }, [permissions, permissionState.length]);

  const grouped = useMemo(() => {
    return permissionState.reduce<Record<string, PermissionState[]>>((acc, perm) => {
      const key = perm.category || "Khác";
      if (!acc[key]) acc[key] = [];
      acc[key].push(perm);
      return acc;
    }, {});
  }, [permissionState]);

  const selected = useMemo(
    () => permissionState.find((item) => item.id === selectedId) || null,
    [permissionState, selectedId]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category) return;

    if (form.id) {
      setPermissionState((prev) =>
        prev.map((item) =>
          item.id === form.id
            ? {
                ...item,
                name: form.name,
                description: form.description,
                category: form.category,
              }
            : item
        )
      );
      setSelectedId(form.id);
    } else {
      const newItem: PermissionState = {
        id: `${Date.now()}`,
        name: form.name,
        description: form.description,
        category: form.category,
      };
      setPermissionState((prev) => [newItem, ...prev]);
      setSelectedId(newItem.id);
    }

    setForm(emptyForm);
  };

  const onEdit = (item: PermissionState) => {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
    });
  };

  const onDelete = (id: string) => {
    setPermissionState((prev) => prev.filter((item) => item.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (form.id === id) setForm(emptyForm);
  };

  const confirmDeleteItem = permissionState.find((item) => item.id === confirmDeleteId) || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Phân quyền hệ thống</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          CRUD chi tiết cho quyền: tạo, xem, sửa, xóa với nhóm theo module.
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
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => onEdit(perm)}
                          className="rounded bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(perm.id)}
                          className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </QueryState>
        </div>

        <div className="space-y-4">
          <form onSubmit={onSubmit} className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {form.id ? "Cập nhật quyền" : "Tạo quyền mới"}
            </h2>
            <div className="mt-3 space-y-2">
              <input
                placeholder="Tên quyền"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="h-10 w-full rounded border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <input
                placeholder="Mô tả"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="h-10 w-full rounded border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <input
                placeholder="Danh mục"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="h-10 w-full rounded border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <div className="flex gap-2">
                <button type="submit" className="rounded bg-primary-600 px-3 py-2 text-sm font-medium text-white">
                  {form.id ? "Lưu" : "Tạo"}
                </button>
                <button
                  type="button"
                  onClick={() => setForm(emptyForm)}
                  className="rounded bg-gray-100 px-3 py-2 text-sm font-medium dark:bg-gray-800"
                >
                  Reset
                </button>
              </div>
            </div>
          </form>

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

      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogTitle>Xóa quyền &quot;{confirmDeleteItem?.name}&quot;?</DialogTitle>
          <DialogDescription>Hành động này không thể hoàn tác.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDeleteId) onDelete(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
            >
              Xóa quyền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
