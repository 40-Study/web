"use client";

import { Fragment, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuditLogActions, useAuditLogs } from "@/hooks/queries/use-audit-logs";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { auditActionLabel, type AuditLogItem } from "@/services/audit-log.service";
import { QueryState } from "@/components/common/query-state";
import { Badge } from "@/components/ui/badge";
import { formatVnDateTime } from "../_lib/format-vn-datetime";

const PAGE_SIZE = 20;
const INPUT_CLASS =
  "h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900";

function parsePage(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

function targetText(log: AuditLogItem): string {
  if (!log.target_type && !log.target_id) return "—";
  return [log.target_type, log.target_id].filter(Boolean).join(": ");
}

export default function AdminAuditLogsPage() {
  // useSearchParams cần Suspense boundary khi Next prerender trang client.
  return (
    <Suspense fallback={null}>
      <AuditLogsContent />
    </Suspense>
  );
}

function AuditLogsContent() {
  // Bộ lọc nằm trên URL (?action=&actor_id=&from=&to=&page=) để F5/quay lại/gửi link vẫn giữ đúng
  // bộ lọc — cùng cách trang Đơn hàng. URL là nguồn sự thật; ô actor_id ghi lên URL sau debounce.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const action = searchParams.get("action") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const urlActor = searchParams.get("actor_id") ?? "";
  const page = parsePage(searchParams.get("page"));

  const [actorDraft, setActorDraft] = useState(urlActor);
  const debouncedActor = useDebouncedValue(actorDraft.trim(), 400);
  const [expanded, setExpanded] = useState<string | null>(null);

  const updateQuery = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "" || (key === "page" && value === 1)) next.delete(key);
      else next.set(key, String(value));
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Back/Forward đổi ?actor_id= thì ô nhập theo URL; bỏ qua khi URL vừa do chính ô này ghi.
  useEffect(() => {
    if (urlActor !== debouncedActor) setActorDraft(urlActor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlActor]);
  useEffect(() => {
    if (urlActor !== debouncedActor) updateQuery({ actor_id: debouncedActor, page: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedActor]);

  const { data, isLoading, isError, error, refetch } = useAuditLogs({
    page,
    page_size: PAGE_SIZE,
    action,
    actor_id: urlActor,
    from,
    to,
  });
  const { data: actions = [] } = useAuditLogActions();
  const items = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nhật ký hoạt động</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Theo dõi các thao tác quản trị để kiểm soát thay đổi hệ thống.
        </p>
      </div>

      <section className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            aria-label="Lọc theo hành động"
            value={action}
            onChange={(e) => updateQuery({ action: e.target.value, page: null })}
            className={INPUT_CLASS}
          >
            <option value="">Tất cả hành động</option>
            {actions.map((code) => (
              <option key={code} value={code}>
                {auditActionLabel(code)}
              </option>
            ))}
          </select>
          <input
            aria-label="Lọc theo ID người thao tác"
            value={actorDraft}
            onChange={(e) => setActorDraft(e.target.value)}
            placeholder="ID người thao tác..."
            className={INPUT_CLASS}
          />
          <input
            type="date"
            aria-label="Từ ngày"
            value={from}
            max={to || undefined}
            onChange={(e) => updateQuery({ from: e.target.value, page: null })}
            className={INPUT_CLASS}
          />
          <input
            type="date"
            aria-label="Đến ngày"
            value={to}
            min={from || undefined}
            onChange={(e) => updateQuery({ to: e.target.value, page: null })}
            className={INPUT_CLASS}
          />
        </div>
      </section>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && items.length === 0}
        emptyTitle="Chưa có nhật ký hoạt động nào"
        emptyDescription="Không có thao tác quản trị nào khớp bộ lọc hiện tại."
      >
        {/* overflow-x-auto để bảng nhiều cột cuộn ngang được trên mobile (H-11) */}
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {["Thời gian", "Người thao tác", "Hành động", "Đối tượng", "Kết quả", "IP", ""].map((h) => (
                  <th key={h || "expand"} className="px-4 py-3 text-left font-medium text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((log) => (
                <Fragment key={log.id}>
                  <tr>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                      {formatVnDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {log.actor ? (
                        <>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{log.actor.name}</p>
                          <p className="text-xs text-gray-500">{log.actor.email}</p>
                        </>
                      ) : (
                        <span className="text-gray-400">Tài khoản không còn</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{auditActionLabel(log.action)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{targetText(log)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="success">{log.status_code}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{log.ip ?? "—"}</td>
                    <td className="px-4 py-3">
                      {log.metadata && (
                        <button
                          type="button"
                          aria-expanded={expanded === log.id}
                          onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                          className="rounded bg-gray-100 px-2 py-1 text-xs font-medium hover:bg-gray-200 dark:bg-gray-800"
                        >
                          {expanded === log.id ? "Ẩn chi tiết" : "Chi tiết"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {log.metadata && expanded === log.id && (
                    <tr>
                      <td colSpan={7} className="bg-gray-50 px-4 py-3 dark:bg-gray-900">
                        <pre className="overflow-x-auto text-xs text-gray-700 dark:text-gray-300">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-1 text-sm text-gray-500">
            <span>
              Trang {page}/{totalPages} — {data?.total} thao tác
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => updateQuery({ page: page - 1 })}
                className="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => updateQuery({ page: page + 1 })}
                className="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </QueryState>
    </div>
  );
}
