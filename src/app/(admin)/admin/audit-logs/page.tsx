"use client";

import { Info } from "lucide-react";

// TODO(M-14): chưa có endpoint audit-log ở backend. Trang này CỐ Ý không có dữ liệu —
// 4 dòng mẫu trước đây (LOG-8001..8004) đã bị bỏ vì trông y hệt nhật ký thật. Khi backend
// có API, thay bằng useQuery gọi service thật và nối isLoading/isError qua <QueryState>
// như các trang admin khác.
type AuditLogRow = {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
  level: string;
};

const auditLogs: AuditLogRow[] = [];

export default function AdminAuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nhật ký hoạt động</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Theo dõi các thao tác quản trị để kiểm soát thay đổi hệ thống.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
        <Info className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          Backend <strong>chưa có API nhật ký hoạt động</strong>, nên bảng dưới đây đang trống.
          Bảng sẽ tự động dùng dữ liệu thật khi endpoint tương ứng sẵn sàng.
        </p>
      </div>

      {/* overflow-x-auto thay vì overflow-hidden để bảng 6 cột cuộn ngang được trên mobile (H-11) */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
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
            {auditLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  Chưa có dữ liệu nhật ký — tính năng đang được phát triển
                </td>
              </tr>
            )}
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
