"use client";

const auditLogs = [
  { id: "LOG-8001", actor: "admin@fortex.vn", action: "CREATE_ORGANIZATION", target: "org.fortex-hcm", time: "2026-03-27 01:10", level: "INFO" },
  { id: "LOG-8002", actor: "owner@fortex.vn", action: "UPDATE_ROLE", target: "role.system_admin", time: "2026-03-27 00:55", level: "WARN" },
  { id: "LOG-8003", actor: "admin@fortex.vn", action: "ASSIGN_PERMISSION", target: "permission.manage_permissions", time: "2026-03-26 23:44", level: "INFO" },
  { id: "LOG-8004", actor: "security@fortex.vn", action: "REVOKE_SYSTEM_ROLE", target: "user.7821", time: "2026-03-26 22:16", level: "CRITICAL" },
];

export default function AdminAuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nhật ký hoạt động</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Theo dõi các thao tác quản trị để kiểm soát thay đổi hệ thống.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Log ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Người thao tác</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Hành động</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Đối tượng</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Thời gian</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Mức độ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{log.id}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{log.actor}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{log.action}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{log.target}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{log.time}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {log.level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
