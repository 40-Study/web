"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/common/query-state";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/queries/use-notifications";

/** Định dạng thời gian tương đối theo tiếng Việt, dùng chung ý tưởng với header.tsx. */
function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

/**
 * Trang danh sách thông báo đầy đủ (H-06) — đích thật cho link "/notifications"
 * đã có sẵn ở header.tsx ("Xem tất cả thông báo") nhưng trước đó chưa có page.
 */
export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useNotifications(page);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
            <Bell className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thông báo</h1>
            {data && data.unread_count > 0 && (
              <p className="text-sm text-muted-foreground">{data.unread_count} thông báo chưa đọc</p>
            )}
          </div>
        </div>
        {data && data.unread_count > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Check className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Đọc tất cả
          </Button>
        )}
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={notifications.length === 0}
        emptyTitle="Chưa có thông báo nào"
        emptyDescription="Thông báo về khóa học, bài tập và tin nhắn sẽ xuất hiện ở đây."
        onRetry={() => refetch()}
      >
        <ul className="divide-y divide-gray-100 dark:divide-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {notifications.map((item) => (
            <li key={item.id}>
              <button
                className={`w-full text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                  !item.is_read ? "bg-primary-50/50 dark:bg-primary-900/10" : ""
                }`}
                onClick={() => {
                  if (!item.is_read) markReadMutation.mutate(item.id);
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      !item.is_read ? "bg-primary-500" : "bg-transparent"
                    }`}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${
                        !item.is_read
                          ? "text-gray-900 dark:text-gray-100 font-medium"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.content && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.content}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">{timeAgo(item.created_at)}</p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Trước
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Trang {page}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Sau
            </Button>
          </div>
        )}
      </QueryState>
    </div>
  );
}
