"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAdminRevenueReport, usePlatformFeeSetting } from "@/hooks/queries/use-admin-reports";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { QueryState } from "@/components/common/query-state";
import { formatVnd } from "@/lib/vnd-format";
import { successRateHint, successRateValue } from "@/lib/revenue-report";
import { ORDER_STATUS_LABEL } from "@/services/order.service";

// ─── Local types ──────────────────────────────────────────────────────────────

type PeriodFilter = "7days" | "30days" | "90days";

const PERIOD_DAYS: Record<PeriodFilter, number> = { "7days": 7, "30days": 30, "90days": 90 };

// QA-C-08: nhãn trạng thái đơn lấy từ cùng bảng với trang Đơn hàng (ORDER_STATUS_LABEL) để cùng một đơn không
// lúc "Đang xử lý" lúc "Đang chờ chuyển khoản". Riêng "failed" chỉ có trong báo cáo nên bổ sung ở đây.
const STATUS_LABEL: Record<string, string> = { ...ORDER_STATUS_LABEL, failed: "Thất bại" };

// ─── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm dark:border-gray-800">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<PeriodFilter>("30days");

  const { from, to } = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: now.toISOString() };
  }, [period]);

  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminRevenueReport({ from, to });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Báo cáo doanh thu nền tảng
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Doanh thu thật tính trực tiếp từ đơn hàng — không phải ví của người xem báo cáo.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Số liệu tính theo đơn tạo trong kỳ đã chọn.
        </p>
      </div>

      {/* Filter khoảng thời gian */}
      <section className="rounded-xl border bg-card p-4 shadow-sm dark:border-gray-800">
        <div className="flex gap-2">
          {(["7days", "30days", "90days"] as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                period === p
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {PERIOD_DAYS[p]} ngày gần nhất
            </button>
          ))}
        </div>
      </section>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
        {report && (
          <>
            {/* Metric cards — gộp / hoàn / ròng / phí nền tảng / phần giảng viên (quyết định #2) */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard label="Doanh thu gộp" value={formatVnd(report.gross_revenue)} />
              <MetricCard label="Đã hoàn tiền" value={formatVnd(report.refund_amount)} />
              <MetricCard
                label="Doanh thu ròng (sau hoàn tiền)"
                value={formatVnd(report.net_revenue)}
                hint="Sau hoàn tiền, trước phí nền tảng."
              />
              <MetricCard
                label="Phí nền tảng"
                value={formatVnd(report.platform_fee_amount)}
                hint="Chốt theo % lúc từng đơn thanh toán — đổi cấu hình không ảnh hưởng đơn cũ."
              />
              <MetricCard
                label="Phần giảng viên"
                value={formatVnd(report.teacher_share_amount)}
                hint="Doanh thu ròng trừ phí nền tảng."
              />
              <MetricCard
                label="Tỷ lệ thành công"
                value={successRateValue(report)}
                hint={successRateHint(report)}
              />
            </section>

            {/* Phân bổ theo trạng thái */}
            <section className="rounded-xl border bg-card p-4 shadow-sm dark:border-gray-800">
              <h2 className="mb-3 text-base font-semibold">Phân bổ theo trạng thái</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(report.by_status).map(([status, count]) => (
                  <div key={status} className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">{STATUS_LABEL[status] ?? status}</p>
                    <p className="text-lg font-semibold">{count}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </QueryState>

      {/* Cấu hình % phí nền tảng (quyết định #2) — chỉ SYSTEM_SETTINGS_MANAGE mới sửa được. */}
      <Can permission={PERMISSIONS.MANAGE_PLATFORM_FEE}>
        <PlatformFeeSettingCard />
      </Can>
    </div>
  );
}

function PlatformFeeSettingCard() {
  const { data, isLoading } = usePlatformFeeSetting();
  // Backend mã hoá decimal thành chuỗi; Number() để hiển thị gọn ("5" -> "5%", "12.50" -> "12.5%").
  const currentPercent = Number(data?.platform_fee_percent ?? 0);

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm dark:border-gray-800">
      <h2 className="mb-1 text-base font-semibold">Phí nền tảng hiện hành</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        % áp dụng cho đơn thanh toán SAU thời điểm lưu — không ảnh hưởng đơn đã hoàn tất trước đó
        (mỗi đơn chốt % ngay lúc thanh toán).
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-foreground">
            {currentPercent}%
          </span>
          {/* Nơi sửa duy nhất là trang cấu hình hệ thống (phase 5). */}
          <Link href="/admin/settings" className="text-sm font-medium text-primary-700 hover:underline dark:text-primary-300">
            Chỉnh sửa tại Cấu hình hệ thống
          </Link>
        </div>
      )}
    </section>
  );
}
