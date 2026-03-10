"use client";

import { useAuthStore } from "@/stores/auth.store";
import { useMe } from "@/hooks/queries/use-auth";

export default function DashboardPage() {
  const { activeRole, activeOrg } = useAuthStore();
  const { data: meData } = useMe();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-800">Xin chào!</h2>
          <p className="text-gray-600">
            {meData?.user?.name || "Người dùng"}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-800">Vai trò</h2>
          <p className="text-gray-600 capitalize">{activeRole || "—"}</p>
        </div>

        {activeOrg && (
          <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="mb-2 text-lg font-semibold text-gray-800">Tổ chức</h2>
            <p className="text-gray-600">{activeOrg.name}</p>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Bắt đầu nhanh</h2>
        <p className="text-gray-500">
          Chức năng dashboard đang được phát triển...
        </p>
      </div>
    </div>
  );
}
