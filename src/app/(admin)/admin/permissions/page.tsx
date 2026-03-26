"use client";

import { useMemo } from "react";
import { usePermissions } from "@/hooks/queries/use-admin";

export default function AdminPermissionsPage() {
  const { data: permissions = [], isLoading } = usePermissions();

  const grouped = useMemo(() => {
    return permissions.reduce<Record<string, typeof permissions>>((acc, perm) => {
      const key = perm.category || "Khác";
      if (!acc[key]) acc[key] = [];
      acc[key].push(perm);
      return acc;
    }, {});
  }, [permissions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Phân quyền hệ thống</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Danh sách quyền được nhóm theo module để dễ theo dõi.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          Đang tải dữ liệu quyền...
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          Chưa có quyền nào.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category} className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{category}</h2>
              <div className="mt-3 space-y-2">
                {items.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{perm.name}</p>
                      <p className="text-xs text-gray-500">{perm.description}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {perm.category}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
