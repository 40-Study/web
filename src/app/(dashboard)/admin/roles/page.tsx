"use client";

import { useSystemRoles, usePermissions } from "@/hooks/queries/use-admin";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";

export default function RolesPage() {
  const { data: rolesData, isLoading: rolesLoading } = useSystemRoles();
  const { data: permsData } = usePermissions();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Quản lý vai trò</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Roles */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Vai trò hệ thống</h2>
          {rolesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {rolesData?.roles.map((role) => (
                <div key={role.id} className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{role.name}</h3>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {role.user_count} users
                    </span>
                  </div>
                  {role.description && (
                    <p className="mt-1 text-sm text-gray-500">{role.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((perm) => (
                      <span
                        key={perm}
                        className="rounded bg-primary-50 px-2 py-0.5 text-xs text-primary-700"
                      >
                        {perm}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permissions */}
        <Can permission={PERMISSIONS.MANAGE_PERMISSIONS}>
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-800">Quyền hệ thống</h2>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="max-h-96 space-y-2 overflow-auto">
                {permsData?.permissions.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                      <p className="text-xs text-gray-500">{perm.description}</p>
                    </div>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {perm.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Can>
      </div>
    </div>
  );
}
