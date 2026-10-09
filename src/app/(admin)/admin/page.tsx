"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { useOrganizations, usePermissions, useSystemRolesWithUserCounts } from "@/hooks/queries/use-admin";
import { useAuditLogs } from "@/hooks/queries/use-audit-logs";
import { Can } from "@/components/guards";
import { QueryState } from "@/components/common/query-state";
import { EmptyState } from "@/components/ui/empty-state";
import { formatVnDateTime } from "@/lib/vn-datetime";
import { PERMISSIONS } from "@/lib/permissions";
import { auditActionLabel } from "@/services/audit-log.service";

const RECENT_ACTIVITY_SIZE = 5;

/**
 * "Hoạt động gần đây": 5 dòng nhật ký mới nhất. Có QueryState riêng (không dùng chung với các số liệu
 * phía trên) để lỗi tạm thời chỉ làm khối này báo lỗi. API cần SYSTEM_SETTINGS_MANAGE nên cả khối được
 * ẩn với admin thiếu quyền (QA 261009 L6) — component này chỉ mount, và chỉ gọi API, khi đã có quyền.
 */
function RecentActivity() {
  const { data, isLoading, isError, error, refetch } = useAuditLogs({ page_size: RECENT_ACTIVITY_SIZE });
  const items = data?.items ?? [];
  return (
    <>
      <div className="mt-4">
        <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
              <EmptyState
                icon={Activity}
                title="Chưa có nhật ký hoạt động"
                description="Nhật ký thao tác quản trị sẽ hiển thị tại đây khi hệ thống bắt đầu ghi nhận."
              />
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{auditActionLabel(item.action)}</p>
                  <p className="text-xs text-gray-500">
                    {item.actor?.name ?? "—"} · {formatVnDateTime(item.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </QueryState>
      </div>
      <Link href="/admin/audit-logs" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:underline">
        Xem tất cả
      </Link>
    </>
  );
}

export default function AdminIndexPage() {
  const {
    data: organizations = [],
    isLoading: orgLoading,
    isError: orgError,
    refetch: refetchOrgs,
  } = useOrganizations();
  const {
    roles,
    totalAssignedUsers,
    totalAssignedUsersError,
    isLoading: rolesLoading,
    isError: rolesError,
    refetch: refetchRoles,
  } = useSystemRolesWithUserCounts();
  const {
    data: permissions = [],
    isLoading: permsLoading,
    isError: permsError,
    refetch: refetchPerms,
  } = usePermissions();

  // A-P2-2: sắp xếp GIẢM DẦN theo userCount thật trước khi lấy top 4 — trước đây chỉ
  // `roles.slice(0, 4)` (thứ tự ngẫu nhiên theo API) nên nhãn "Top" sai.
  const topRoles = useMemo(() => {
    return [...roles]
      .sort((a, b) => (b.userCount ?? -1) - (a.userCount ?? -1))
      .slice(0, 4);
  }, [roles]);

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
            <p className="text-sm text-gray-500">Tổng lượt gán role</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {totalAssignedUsersError ? "lỗi" : totalAssignedUsers === null ? "…" : totalAssignedUsers}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">
              {totalAssignedUsersError
                ? "Không tải được số người dùng theo vai trò — có thể thiếu quyền hoặc hệ thống đang lỗi."
                : "Tổng số lượt gán vai trò: một người giữ 2 vai trò sẽ được tính 2 lần."}
            </p>
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
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        role.userCountError
                          ? "bg-amber-100 text-amber-700"
                          : "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                      }`}
                      title={role.userCountError ? "Không tải được số người dùng (có thể thiếu quyền hoặc hệ thống đang lỗi)" : undefined}
                    >
                      {role.userCountError ? "lỗi" : role.userCount === null ? "…" : `${role.userCount} user`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <Can permission={PERMISSIONS.SYSTEM_SETTINGS_MANAGE}>
            <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Hoạt động gần đây</h3>
              <RecentActivity />
            </div>
          </Can>
        </section>
      </QueryState>
    </div>
  );
}
