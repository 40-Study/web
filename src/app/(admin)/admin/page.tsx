"use client";

import { useMemo } from "react";
import { useOrganizations, usePermissions, useSystemRoles } from "@/hooks/queries/use-admin";

const recentActivities = [
  { id: "ACT-2401", action: "Cập nhật vai trò SYSTEM_ADMIN", target: "role.system_admin", time: "2 phút trước", status: "Thành công" },
  { id: "ACT-2402", action: "Tạo tổ chức mới", target: "org.fortex-hcm", time: "12 phút trước", status: "Thành công" },
  { id: "ACT-2403", action: "Gán quyền manage_permissions", target: "role.org_owner", time: "26 phút trước", status: "Đang xử lý" },
  { id: "ACT-2404", action: "Xóa tổ chức không hoạt động", target: "org.legacy-2023", time: "1 giờ trước", status: "Thành công" },
];

export default function AdminIndexPage() {
  const { data: organizations = [], isLoading: orgLoading } = useOrganizations();
  const { data: roles = [], isLoading: rolesLoading } = useSystemRoles();
  const { data: permissions = [], isLoading: permsLoading } = usePermissions();

  const totalUsers = useMemo(
    () => roles.reduce((sum, role) => sum + (role.user_count || 0), 0),
    [roles]
  );

  const topRoles = useMemo(
    () => [...roles].sort((a, b) => (b.user_count || 0) - (a.user_count || 0)).slice(0, 4),
    [roles]
  );

  const loading = orgLoading || rolesLoading || permsLoading;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Operations Overview</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Theo dõi nhanh hiệu suất quản trị hệ thống theo thời gian thực.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <p className="text-sm text-gray-500">Tổng tổ chức</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {loading ? "..." : organizations.length}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <p className="text-sm text-gray-500">Vai trò hệ thống</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {loading ? "..." : roles.length}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <p className="text-sm text-gray-500">Quyền hệ thống</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {loading ? "..." : permissions.length}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <p className="text-sm text-gray-500">Tổng user được gán role</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {loading ? "..." : totalUsers}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top vai trò theo số lượng user</h3>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Đang tải...</p>
            ) : topRoles.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có dữ liệu vai trò</p>
            ) : (
              topRoles.map((role) => (
                <div key={role.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{role.name}</p>
                    <p className="text-xs text-gray-500">{role.description || "Không có mô tả"}</p>
                  </div>
                  <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                    {role.user_count || 0} users
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Hoạt động gần đây</h3>
          <div className="mt-4 space-y-2">
            {recentActivities.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.action}</p>
                    <p className="text-xs text-gray-500">{item.target}</p>
                  </div>
                  <span className="text-xs text-gray-500">{item.time}</span>
                </div>
                <p className="mt-1 text-xs text-primary-600 dark:text-primary-300">{item.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
