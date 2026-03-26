"use client";

import { useMemo } from "react";
import { useOrganizations, usePermissions, useSystemRoles } from "@/hooks/queries/use-admin";

export default function AdminReportsPage() {
  const { data: organizations = [] } = useOrganizations();
  const { data: roles = [] } = useSystemRoles();
  const { data: permissions = [] } = usePermissions();

  const reportRows = useMemo(
    () => [
      { label: "Số tổ chức đang hoạt động", value: organizations.length, trend: "+3 trong 7 ngày" },
      { label: "Số vai trò hệ thống", value: roles.length, trend: "+1 trong 30 ngày" },
      { label: "Số quyền đã định nghĩa", value: permissions.length, trend: "Không đổi" },
      {
        label: "Tổng lượt gán role",
        value: roles.reduce((sum, role) => sum + (role.user_count || 0), 0),
        trend: "+12.4%",
      },
    ],
    [organizations, permissions, roles]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Báo cáo hệ thống</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tóm tắt chỉ số quản trị và tăng trưởng hệ thống.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reportRows.map((row) => (
          <article key={row.label} className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <p className="text-sm text-gray-500">{row.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{row.value}</p>
            <p className="mt-1 text-xs text-primary-600 dark:text-primary-300">{row.trend}</p>
          </article>
        ))}
      </div>

      <section className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Nhận định nhanh</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
          <li>Ưu tiên kiểm tra nhóm quyền có tần suất thay đổi cao trong tuần.</li>
          <li>Role có user_count thấp nên được rà soát để tinh gọn hệ thống phân quyền.</li>
          <li>Nếu số tổ chức tăng nhanh, nên chuẩn bị quy trình onboarding quản trị viên theo mẫu.</li>
        </ul>
      </section>
    </div>
  );
}
