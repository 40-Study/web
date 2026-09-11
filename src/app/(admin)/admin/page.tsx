"use client";

import { useMemo } from "react";
import { useOrganizations, usePermissions, useSystemRoles } from "@/hooks/queries/use-admin";
import { QueryState } from "@/components/common/query-state";


export default function AdminIndexPage() {
  const {
    data: organizations = [],
    isLoading: orgLoading,
    isError: orgError,
    refetch: refetchOrgs,
  } = useOrganizations();
  const {
    data: roles = [],
    isLoading: rolesLoading,
    isError: rolesError,
    refetch: refetchRoles,
  } = useSystemRoles();
  const {
    data: permissions = [],
    isLoading: permsLoading,
    isError: permsError,
    refetch: refetchPerms,
  } = usePermissions();

  const topRoles = useMemo(
    () => roles.slice(0, 4),
    [roles]
  );

  const loading = orgLoading || rolesLoading || permsLoading;
  const hasError = orgError || rolesError || permsError;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tổng quan vận hành</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Theo dõi nhanh hiệu suất quản trị hệ thống theo thời gian thực.
        </p>
      </section>

      <QueryState
        isLoading={loading}
        isError={hasError}
        onRetry={() => {
          refetchOrgs();
          refetchRoles();
          refetchPerms();
        }}
      >
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <p className="text-sm text-gray-500">Tổng tổ chức</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {organizations.length}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <p className="text-sm text-gray-500">Vai trò hệ thống</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {roles.length}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <p className="text-sm text-gray-500">Quyền hệ thống</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {permissions.length}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <p className="text-sm text-gray-500">Tổng user được gán role</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">—</p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top vai trò theo số lượng user</h3>
            <div className="mt-4 space-y-3">
              {topRoles.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có dữ liệu vai trò</p>
              ) : (
                topRoles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{role.name}</p>
                      <p className="text-xs text-gray-500">{role.description || "Không có mô tả"}</p>
                    </div>
                    <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                      {role.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Hoạt động gần đây</h3>
            {/* Backend chưa có API nhật ký hoạt động (xem admin/audit-logs). Trước đây khối này
                render một mảng tĩnh 4 dòng trông như dữ liệu thật — đã bỏ hẳn. Khi có endpoint,
                thay khối rỗng bên dưới bằng useQuery + <QueryState> như các trang admin khác. */}
            <div className="mt-4 rounded-lg border border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chưa có dữ liệu nhật ký hoạt động
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Tính năng đang được phát triển
              </p>
            </div>
          </div>
        </section>
      </QueryState>
    </div>
  );
}
