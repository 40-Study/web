"use client";

import { Fragment, Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuditLogActions, useAuditLogs } from "@/hooks/queries/use-audit-logs";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { auditActionLabel, type AuditLogItem } from "@/services/audit-log.service";
import { QueryState } from "@/components/common/query-state";
import { isUuid } from "@/lib/uuid";
import { Badge } from "@/components/ui/badge";
import { formatVnDateTime } from "../_lib/format-vn-datetime";

const PAGE_SIZE = 20;
// Tiêu đề cột; ô tương ứng mang cùng chuỗi ở `data-label` để dưới `sm` (thẻ xếp dọc) vẫn có nhãn.
const COL = {
  time: "Thời gian",
  actor: "Người thao tác",
  action: "Hành động",
  target: "Đối tượng",
  result: "Kết quả",
  ip: "IP",
} as const;
const HEADERS = [...Object.values(COL), ""];
// ADM-L9: bảng 7 cột ở 390px phải cuộn ngang và cột "Hành động" bị cắt/rớt nhiều dòng. Dưới `sm` mỗi dòng thành
// một thẻ xếp dọc (nhãn trái, giá trị phải, không cuộn ngang); từ `sm` trở lên là bảng như cũ.
const ACTION_COLUMN_CLASS = "sm:min-w-[10rem]";
const CELL_CLASS =
  "flex items-start justify-between gap-4 px-4 py-1.5 text-right before:shrink-0 before:text-left before:font-medium before:text-gray-500 before:content-[attr(data-label)] sm:table-cell sm:py-3 sm:text-left sm:before:hidden";
const DATE_RANGE_ERROR = "Từ ngày phải trước hoặc cùng ngày với Đến ngày.";
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

  // Query MỚI NHẤT đã gửi đi. Dựng từ `searchParams` của lần render trước thì hai thay đổi liên tiếp (chọn Từ
  // ngày rồi Đến ngày trước khi kịp render lại) ghi đè nhau và mất Từ ngày (ADM-L8). Ref được đồng bộ lại
  // theo URL mỗi khi URL thực sự đổi (Back/Forward, link chia sẻ).
  const latestQuery = useRef(searchParams.toString());
  useEffect(() => {
    latestQuery.current = searchParams.toString();
  }, [searchParams]);

  const updateQuery = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(latestQuery.current);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "" || (key === "page" && value === 1)) next.delete(key);
      else next.set(key, String(value));
    }
    const qs = next.toString();
    latestQuery.current = qs;
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Back/Forward đổi ?actor_id= thì ô nhập theo URL; bỏ qua khi URL vừa do chính ô này ghi.
  useEffect(() => {
    if (urlActor !== debouncedActor) setActorDraft(urlActor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlActor]);
  // Backend trả 400 INVALID_FILTER cho actor_id không phải UUID (L7): chỉ ghi lên URL khi ô trống (bỏ lọc) hoặc
  // đã là UUID đầy đủ — giá trị gõ dở không được tới URL/API. URL vẫn giữ giá trị hợp lệ gần nhất.
  const actorFilterShouldSync = debouncedActor === "" || isUuid(debouncedActor);
  useEffect(() => {
    if (urlActor !== debouncedActor && actorFilterShouldSync) updateQuery({ actor_id: debouncedActor, page: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedActor]);

  // Khoảng ngày ngược (Từ > Đến): nói rõ cho admin thay vì trả bảng rỗng "không có thao tác" (ADM-L8).
  const dateRangeError = from && to && from > to ? DATE_RANGE_ERROR : null;
  const { data, isLoading, isError, error, refetch } = useAuditLogs(
    {
      page,
      page_size: PAGE_SIZE,
      action,
      // Link chia sẻ có actor_id sai dạng cũng không được gửi đi (sẽ 400).
      actor_id: isUuid(urlActor) ? urlActor : "",
      from,
      to,
    },
    { enabled: !dateRangeError }
  );
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
            placeholder="ID người thao tác (UUID)..."
            aria-invalid={!actorFilterShouldSync}
            aria-describedby={actorFilterShouldSync ? undefined : "actor-id-hint"}
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
        {dateRangeError && (
          <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
            {dateRangeError}
          </p>
        )}
        {!actorFilterShouldSync && (
          <p id="actor-id-hint" className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            ID người thao tác phải là UUID đầy đủ (36 ký tự, dạng 3f2a9c1e-7b4d-4e0a-9d51-0c8f6a2b1e34) mới lọc được.
          </p>
        )}
      </section>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!!dateRangeError || (!isLoading && !isError && items.length === 0)}
        emptyTitle={dateRangeError ? "Khoảng ngày chưa hợp lệ" : "Chưa có nhật ký hoạt động nào"}
        emptyDescription={
          dateRangeError
            ? "Sửa Từ ngày / Đến ngày để xem nhật ký."
            : "Không có thao tác quản trị nào khớp bộ lọc hiện tại."
        }
      >
        {/* overflow-x-auto để bảng nhiều cột cuộn ngang được trên mobile (H-11) */}
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <table className="block w-full divide-y sm:table sm:min-w-full divide-gray-200 text-sm dark:divide-gray-800">
            <thead className="hidden bg-gray-50 dark:bg-gray-900 sm:table-header-group">
              <tr>
                {HEADERS.map((h) => (
                  <th
                    key={h || "expand"}
                    className={`px-4 py-3 text-left font-medium text-gray-500 ${h === COL.action ? ACTION_COLUMN_CLASS : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="block divide-y divide-gray-100 dark:divide-gray-800 sm:table-row-group">
              {items.map((log) => (
                <Fragment key={log.id}>
                  <tr className="block py-2 sm:table-row sm:py-0">
                    <td data-label={COL.time} className={`${CELL_CLASS} whitespace-nowrap text-gray-600 dark:text-gray-300`}>
                      {formatVnDateTime(log.created_at)}
                    </td>
                    <td data-label={COL.actor} className={CELL_CLASS}>
                      {log.actor ? (
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{log.actor.name}</p>
                          <p className="text-xs text-gray-500">{log.actor.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">Tài khoản không còn</span>
                      )}
                    </td>
                    <td data-label={COL.action} className={`${CELL_CLASS} text-gray-900 dark:text-gray-100 ${ACTION_COLUMN_CLASS}`}>
                      {auditActionLabel(log.action)}
                    </td>
                    <td data-label={COL.target} className={`${CELL_CLASS} break-all text-gray-600 dark:text-gray-300 sm:break-normal`}>
                      {targetText(log)}
                    </td>
                    <td data-label={COL.result} className={CELL_CLASS}>
                      <Badge variant="success">{log.status_code}</Badge>
                    </td>
                    <td data-label={COL.ip} className={`${CELL_CLASS} text-gray-600 dark:text-gray-300`}>
                      {log.ip ?? "—"}
                    </td>
                    <td className={CELL_CLASS}>
                      {log.metadata && (
                        <button
                          type="button"
                          aria-expanded={expanded === log.id}
                          onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                          className="ml-auto rounded bg-gray-100 px-2 py-1 text-xs font-medium hover:bg-gray-200 dark:bg-gray-800 sm:ml-0"
                        >
                          {expanded === log.id ? "Ẩn chi tiết" : "Chi tiết"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {log.metadata && expanded === log.id && (
                    <tr className="block sm:table-row">
                      <td colSpan={7} className="block bg-gray-50 px-4 py-3 dark:bg-gray-900 sm:table-cell">
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
