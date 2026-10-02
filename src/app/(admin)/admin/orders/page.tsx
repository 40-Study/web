"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAdminOrders } from "@/hooks/queries/use-admin-orders";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/services/order.service";
import { QueryState } from "@/components/common/query-state";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { lateRefundSummaryText } from "@/lib/late-refund";

// ─── Local types ──────────────────────────────────────────────────────────────

type StatusFilter = OrderStatus | "";

const STATUS_LIST: OrderStatus[] = [
  "pending",
  "processing",
  "completed",
  "cancelled",
  "refunded",
  "expired",
];

// Màu badge theo trạng thái — "refunded"/"cancelled" PHẢI khác màu nhau (lỗi đã có
// ở trang /admin/reports cũ: đánh đồng 2 trạng thái này, xem qa-260927-admin.md).
const STATUS_VARIANT: Record<OrderStatus, "success" | "warning" | "destructive" | "outline" | "secondary"> = {
  pending: "outline",
  processing: "warning",
  completed: "success",
  cancelled: "secondary",
  refunded: "destructive",
  expired: "outline",
};

const STATUS_LABEL = ORDER_STATUS_LABEL;
const REFUND_NEEDED_BADGE = "Cần hoàn tiền";
const REFUNDED_LATE_BADGE = "Đã hoàn tiền";

function parseStatus(value: string | null): StatusFilter {
  return value && (STATUS_LIST as string[]).includes(value) ? (value as OrderStatus) : "";
}

function parsePage(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  // useSearchParams cần Suspense boundary khi Next prerender trang client.
  return (
    <Suspense fallback={null}>
      <AdminOrdersContent />
    </Suspense>
  );
}

function AdminOrdersContent() {
  // B6 (QA vòng 2 N-13): bộ lọc nằm trên URL (?status=&page=&q=) để F5, quay lại từ trang chi
  // tiết hay gửi link cho người khác vẫn giữ đúng bộ lọc. URL là nguồn sự thật cho status/page.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = parseStatus(searchParams.get("status"));
  const page = parsePage(searchParams.get("page"));
  const urlQuery = searchParams.get("q") ?? "";
  const [search, setSearch] = useState(urlQuery);
  const debouncedSearch = useDebouncedValue(search, 300);

  // Back/Forward đổi ?q= thì ô tìm kiếm phải theo URL (review #34 MINOR). Bỏ qua khi URL vừa được
  // CHÍNH ô này ghi (urlQuery === debouncedSearch), nếu không phím gõ sau lúc debounce sẽ bị ghi đè.
  useEffect(() => {
    if (urlQuery !== debouncedSearch) setSearch(urlQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);
  const limit = 20;

  const updateQuery = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "" || (key === "page" && value === 1)) next.delete(key);
      else next.set(key, String(value));
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const setStatus = (value: StatusFilter) => updateQuery({ status: value, page: null });
  const setPage = (updater: (p: number) => number) => updateQuery({ page: updater(page) });

  // Ô tìm kiếm ghi lên URL sau debounce (không đẩy URL mỗi phím gõ).
  useEffect(() => {
    if ((searchParams.get("q") ?? "") !== debouncedSearch) updateQuery({ q: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { data, isLoading, isError, error, refetch } = useAdminOrders({
    status: status || undefined,
    page,
    limit,
  });

  // Lọc theo mã đơn/email PHÍA CLIENT trên trang hiện tại — filter server-side (status/user_id/
  // from/to) đã đủ cho khối lượng V1; tìm-nhanh-trong-trang không cần round-trip riêng.
  const filteredItems = (data?.items ?? []).filter((o) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) || o.user_email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Đơn hàng</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Toàn bộ đơn hàng trên hệ thống — xem chi tiết và xử lý hoàn tiền.
        </p>
      </div>

      {/* Filters */}
      <section className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã đơn hoặc email học viên..."
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && filteredItems.length === 0}
        emptyTitle="Không có đơn hàng nào"
        emptyDescription="Chưa có đơn khớp bộ lọc hiện tại."
      >
        <section className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left">Mã đơn</th>
                  <th className="px-4 py-3 text-left">Học viên</th>
                  <th className="px-4 py-3 text-left">Khóa học</th>
                  <th className="px-4 py-3 text-left">Tổng tiền</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Ngày tạo</th>
                  <th className="px-4 py-3 text-left" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredItems.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-medium">{order.order_number}</td>
                    <td className="px-4 py-3">{order.user_email}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {order.items.map((i) => i.course_title).join(", ") || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(order.total_amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={STATUS_VARIANT[order.status]}>
                          {STATUS_LABEL[order.status]}
                        </Badge>
                        {/* Tiền về cho đơn đã huỷ/hết hạn: đơn không khôi phục, admin hoàn tiền tay
                            (quyết định chủ dự án, review #76 final). */}
                        {order.refund_needed && <Badge variant="destructive">{REFUND_NEEDED_BADGE}</Badge>}
                        {/* Admin đã ghi nhận chuyển khoản hoàn ở trang chi tiết: cờ tắt, badge đổi tên. */}
                        {!order.refund_needed && order.late_refunded_at && <Badge variant="success">{REFUNDED_LATE_BADGE}</Badge>}
                      </div>
                      {/* L6: bao nhiêu khoản, tổng tiền cần hoàn (chi tiết mã giao dịch ở trang đơn). */}
                      {order.refund_needed && lateRefundSummaryText(order.late_refunds) && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400" data-testid="late-refund-summary">
                          {lateRefundSummaryText(order.late_refunds)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded bg-gray-100 px-2 py-1 text-xs font-medium hover:bg-gray-200 dark:bg-gray-800"
                      >
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-1 text-sm text-gray-500">
            <span>
              Trang {data.page}/{data.total_pages} — {data.total_count} đơn
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700"
              >
                Trước
              </button>
              <button
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
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
