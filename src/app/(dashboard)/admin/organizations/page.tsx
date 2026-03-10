"use client";

import { useState } from "react";
import { useOrganizations, useCreateOrganization, useDeleteOrganization } from "@/hooks/queries/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";

export default function OrganizationsPage() {
  const { data, isLoading } = useOrganizations();
  const createOrg = useCreateOrganization();
  const deleteOrg = useDeleteOrganization();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createOrg.mutate({ name, code }, {
      onSuccess: () => {
        setShowForm(false);
        setName("");
        setCode("");
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý tổ chức</h1>
        <Can permission={PERMISSIONS.MANAGE_ORGANIZATIONS}>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Hủy" : "Thêm tổ chức"}
          </Button>
        </Can>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Tên tổ chức"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Mã tổ chức"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="mt-4" disabled={createOrg.isPending}>
            {createOrg.isPending ? "Đang tạo..." : "Tạo tổ chức"}
          </Button>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.organizations.map((org) => (
            <div
              key={org.id}
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{org.name}</h3>
                <p className="text-sm text-gray-500">{org.code}</p>
              </div>
              <Can permission={PERMISSIONS.MANAGE_ORGANIZATIONS}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteOrg.mutate(org.id)}
                  disabled={deleteOrg.isPending}
                >
                  Xóa
                </Button>
              </Can>
            </div>
          ))}
          {data?.organizations.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-gray-500">Chưa có tổ chức nào</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
