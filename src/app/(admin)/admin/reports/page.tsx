"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useAdminRevenueReport,
  usePlatformFeeSetting,
  useUpdatePlatformFeeSetting,
} from "@/hooks/queries/use-admin-reports";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { QueryState } from "@/components/common/query-state";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

// ─── Local types ──────────────────────────────────────────────────────────────

type PeriodFilter = "7days" | "30days" | "90days";

const PERIOD_DAYS: Record<PeriodFilter, number> = { "7days": 7, "30days": 30, "90days": 90 };

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ thanh toán",
  processing: "Đang xử lý",
  completed: "Hoàn tất",
  failed: "Thất bại",
  refunded: "Đã hoàn tiền",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Báo cáo doanh thu nền tảng
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Doanh thu thật tính trực tiếp từ đơn hàng — không phải ví của người xem báo cáo.
        </p>
      </div>

      {/* Filter khoảng thời gian */}
      <section className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="flex gap-2">
          {(["7days", "30days", "90days"] as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                period === p
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
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
              <MetricCard label="Doanh thu gộp" value={formatCurrency(report.gross_revenue)} />
              <MetricCard label="Đã hoàn tiền" value={formatCurrency(report.refund_amount)} />
              <MetricCard label="Doanh thu ròng" value={formatCurrency(report.net_revenue)} />
              <MetricCard
                label="Phí nền tảng"
                value={formatCurrency(report.platform_fee_amount)}
                hint="Chốt theo % lúc từng đơn thanh toán — đổi cấu hình không ảnh hưởng đơn cũ."
              />
              <MetricCard
                label="Phần giảng viên"
                value={formatCurrency(report.teacher_share_amount)}
                hint="Doanh thu gộp trừ phí nền tảng."
              />
              <MetricCard
                label="Tỷ lệ thành công"
                value={`${report.success_rate.toFixed(1)}%`}
                hint={`${report.completed_count} hoàn tất / ${report.transaction_count} đơn trong kỳ`}
              />
            </section>

            {/* Phân bổ theo trạng thái */}
            <section className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <h2 className="mb-3 text-base font-semibold">Phân bổ theo trạng thái</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(report.by_status).map(([status, count]) => (
                  <div key={status} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                    <p className="text-xs text-gray-500">{STATUS_LABEL[status] ?? status}</p>
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
  const updateMutation = useUpdatePlatformFeeSetting();
  const [draft, setDraft] = useState<string>("");
  const [editing, setEditing] = useState(false);

  const currentPercent = data?.platform_fee_percent ?? 0;

  const startEdit = () => {
    setDraft(String(currentPercent));
    setEditing(true);
  };

  const onSave = () => {
    const percent = Number(draft);
    if (Number.isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("% phí nền tảng phải là số từ 0 đến 100");
      return;
    }
    updateMutation.mutate(percent, { onSuccess: () => setEditing(false) });
  };

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <h2 className="mb-1 text-base font-semibold">Cấu hình phí nền tảng</h2>
      <p className="mb-3 text-xs text-gray-500">
        % áp dụng cho đơn thanh toán SAU thời điểm lưu — không ảnh hưởng đơn đã hoàn tất trước đó
        (mỗi đơn chốt % ngay lúc thanh toán).
      </p>

      {isLoading ? (
        <p className="text-sm text-gray-400">Đang tải...</p>
      ) : editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-10 w-28 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <span className="text-sm text-gray-500">%</span>
          <Button size="sm" isLoading={updateMutation.isPending} onClick={onSave}>
            Lưu
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
            Hủy
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {currentPercent}%
          </span>
          <Button size="sm" variant="outline" onClick={startEdit}>
            Sửa
          </Button>
        </div>
      )}
    </section>
  );
}
