"use client";

import { useMemo, useState } from "react";
import {
  useOrganizations,
  useCreateOrganization,
  useDeleteOrganization,
  useUpdateOrganization,
} from "@/hooks/queries/use-admin";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";

type OrgFormState = {
  id?: string;
  name: string;
  code: string;
};

const emptyForm: OrgFormState = { name: "", code: "" };

export default function OrganizationsPage() {
  const { data = [], isLoading } = useOrganizations();
  const createOrg = useCreateOrganization();
  const updateOrg = useUpdateOrganization();
  const deleteOrg = useDeleteOrganization();

  const [form, setForm] = useState<OrgFormState>(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => data.find((org) => org.id === selectedId) || null,
    [data, selectedId]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) return;

    if (form.id) {
      updateOrg.mutate({ id: form.id, data: { name: form.name, code: form.code } });
    } else {
      createOrg.mutate({ name: form.name, code: form.code });
    }

    setForm(emptyForm);
  };

  const startEdit = (org: (typeof data)[number]) => {
    setForm({ id: org.id, name: org.name, code: org.code });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý tổ chức</h1>
        <p className="mt-1 text-sm text-gray-500">CRUD đầy đủ cho tổ chức và khu chi tiết riêng.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : (
            data.map((org) => (
              <div
                key={org.id}
                className={`rounded-xl bg-white p-4 shadow-sm ${selected?.id === org.id ? "ring-2 ring-primary-200" : ""}`}
              >
                <button className="w-full text-left" onClick={() => setSelectedId(org.id)}>
                  <h3 className="font-semibold text-gray-900">{org.name}</h3>
                  <p className="text-sm text-gray-500">{org.code}</p>
                </button>
                <Can permission={PERMISSIONS.MANAGE_ORGANIZATIONS}>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => startEdit(org)}
                      className="rounded bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => deleteOrg.mutate(org.id)}
                      className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                    >
                      Xóa
                    </button>
                  </div>
                </Can>
              </div>
            ))
          )}
          {data.length === 0 && !isLoading && (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-gray-500">Chưa có tổ chức nào</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Can permission={PERMISSIONS.MANAGE_ORGANIZATIONS}>
            <form onSubmit={onSubmit} className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                {form.id ? "Cập nhật tổ chức" : "Tạo tổ chức mới"}
              </h2>
              <div className="mt-3 space-y-2">
                <input
                  placeholder="Tên tổ chức"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-10 w-full rounded border border-gray-200 px-3 text-sm"
                />
                <input
                  placeholder="Mã tổ chức"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  className="h-10 w-full rounded border border-gray-200 px-3 text-sm"
                />
                <div className="flex gap-2">
                  <button type="submit" className="rounded bg-primary-600 px-3 py-2 text-sm font-medium text-white">
                    {form.id ? "Lưu" : "Tạo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(emptyForm)}
                    className="rounded bg-gray-100 px-3 py-2 text-sm font-medium"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </form>
          </Can>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Chi tiết tổ chức</h2>
            {selected ? (
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="text-gray-500">ID:</span> {selected.id}</p>
                <p><span className="text-gray-500">Tên:</span> {selected.name}</p>
                <p><span className="text-gray-500">Mã:</span> {selected.code}</p>
                <p><span className="text-gray-500">Tạo lúc:</span> {new Date(selected.created_at).toLocaleString("vi-VN")}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Chọn một tổ chức để xem chi tiết.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
