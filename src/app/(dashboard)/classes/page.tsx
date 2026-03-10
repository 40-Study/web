"use client";

import { useState } from "react";
import Link from "next/link";
import { useClasses, useCreateClass } from "@/hooks/queries/use-classes";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";

export default function ClassesPage() {
  const { activeOrg } = useAuthStore();
  const { data, isLoading } = useClasses(activeOrg?.id);
  const createClass = useCreateClass();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) return;
    createClass.mutate(
      { name, code, organization_id: activeOrg.id },
      {
        onSuccess: () => {
          setShowForm(false);
          setName("");
          setCode("");
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lớp học</h1>
        <Can permission={[PERMISSIONS.CREATE_CLASS, PERMISSIONS.MANAGE_ORG_CLASSES]}>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Hủy" : "Tạo lớp mới"}
          </Button>
        </Can>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Tên lớp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Lớp Lập trình Python"
              required
            />
            <Input
              label="Mã lớp"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: PYTHON-01"
              required
            />
          </div>
          <Button type="submit" className="mt-4" disabled={createClass.isPending}>
            {createClass.isPending ? "Đang tạo..." : "Tạo lớp"}
          </Button>
        </form>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/classes/${cls.id}`}
              className="block rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900">{cls.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{cls.code}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                <span>{cls.student_count} học sinh</span>
                <span>{cls.teacher_ids.length} giáo viên</span>
              </div>
            </Link>
          ))}
          {data?.classes.length === 0 && (
            <div className="col-span-2 rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-gray-500">Chưa có lớp học nào</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
