"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useWalletTransactions } from "@/hooks/queries/use-wallet";
import type { WalletTransaction, TransactionStatus } from "@/services/wallet.service";

// ─── Local types ──────────────────────────────────────────────────────────────

type ReportFilter = "today" | "7days" | "all";
type StatusFilter = "ALL" | TransactionStatus;

const STATUS_LIST: TransactionStatus[] = ["completed", "pending", "failed", "cancelled"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const formatDate = (iso: string) => new Date(iso).toLocaleString("vi-VN");

// ─── Sub-components (kept local — page-only UI primitives) ───────────────────

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </article>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 dark:border-gray-800">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [period, setPeriod] = useState<ReportFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: txResponse, isLoading } = useWalletTransactions();

  const filteredRecords = useMemo(() => {
    // Unwrap paginated response — API returns { transactions[], total, page, limit }
    const transactions: WalletTransaction[] = txResponse?.transactions ?? [];
    const now = Date.now();
    return transactions.filter((tx) => {
      const textMatched =
        (tx.order_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (tx.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (tx.payment_method ?? "").toLowerCase().includes(search.toLowerCase());

      const statusMatched = statusFilter === "ALL" || tx.status === statusFilter;

      const timestamp = new Date(tx.created_at).getTime();
      const periodMatched =
        period === "today"
          ? now - timestamp <= 24 * 60 * 60 * 1000
          : period === "7days"
            ? now - timestamp <= 7 * 24 * 60 * 60 * 1000
            : true;

      return textMatched && statusMatched && periodMatched;
    });
  }, [txResponse, search, statusFilter, period]);

  // Auto-select first record once data loads
  const firstId = filteredRecords[0]?.id ?? null;
  const effectiveSelectedId = selectedId ?? firstId;

  const selectedRecord = useMemo(
    () => filteredRecords.find((tx) => tx.id === effectiveSelectedId) ?? filteredRecords[0] ?? null,
    [filteredRecords, effectiveSelectedId]
  );

  const metrics = useMemo(() => {
    const successful = filteredRecords.filter((r) => r.status === "completed");
    const revenue = successful.reduce((sum: number, tx: WalletTransaction) => sum + tx.amount, 0);
    // "cancelled" is the closest status to refunded in this API
    const cancelled = filteredRecords
      .filter((r) => r.status === "cancelled")
      .reduce((sum: number, tx: WalletTransaction) => sum + tx.amount, 0);
    const successRate = filteredRecords.length
      ? (successful.length / filteredRecords.length) * 100
      : 0;
    return {
      revenue,
      transactions: filteredRecords.length,
      refunded: cancelled,
      successRate,
    };
  }, [filteredRecords]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Báo cáo tài chính
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Dashboard doanh thu và danh sách giao dịch chi tiết.
        </p>
      </div>

      {/* Metric cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Gross Revenue" value={formatCurrency(metrics.revenue)} />
        <MetricCard label="Refund Amount" value={formatCurrency(metrics.refunded)} />
        <MetricCard label="Transactions" value={String(metrics.transactions)} />
        <MetricCard label="Success Rate" value={`${metrics.successRate.toFixed(1)}%`} />
      </section>

      {/* Filters */}
      <section className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="grid gap-3 lg:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã đơn, mô tả, phương thức..."
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportFilter)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="today">Hôm nay</option>
            <option value="7days">7 ngày</option>
            <option value="all">Toàn bộ</option>
          </select>
        </div>
      </section>

      {/* Table + Detail panel */}
      <section className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        {/* Transaction table */}
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left">Mã đơn</th>
                  <th className="px-4 py-3 text-left">Mô tả</th>
                  <th className="px-4 py-3 text-left">Phương thức</th>
                  <th className="px-4 py-3 text-left">Số tiền</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500 text-sm"
                    >
                      Không có giao dịch nào.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((tx) => (
                    <tr
                      key={tx.id}
                      className={
                        selectedRecord?.id === tx.id
                          ? "bg-primary-50/60 dark:bg-primary-900/20"
                          : ""
                      }
                    >
                      <td className="px-4 py-3 font-medium">
                        {tx.order_number ?? tx.id}
                      </td>
                      <td className="px-4 py-3">{tx.description ?? "-"}</td>
                      <td className="px-4 py-3">{tx.payment_method ?? "-"}</td>
                      <td className="px-4 py-3">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-3 capitalize">{tx.status}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedId(tx.id)}
                          className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 dark:bg-gray-800"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="text-base font-semibold mb-3">Chi tiết giao dịch</h2>
          {selectedRecord ? (
            <div className="space-y-2 text-sm">
              <DetailRow label="ID" value={selectedRecord.id} />
              <DetailRow label="Mã đơn" value={selectedRecord.order_number ?? "-"} />
              <DetailRow label="Mô tả" value={selectedRecord.description ?? "-"} />
              <DetailRow label="Phương thức" value={selectedRecord.payment_method ?? "-"} />
              <DetailRow label="Số tiền" value={formatCurrency(selectedRecord.amount)} />
              <DetailRow label="Loại" value={selectedRecord.type} />
              <DetailRow label="Trạng thái" value={selectedRecord.status} />
              <DetailRow label="Ngày tạo" value={formatDate(selectedRecord.created_at)} />
              {selectedRecord.paid_at && (
                <DetailRow label="Ngày thanh toán" value={formatDate(selectedRecord.paid_at)} />
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Chưa chọn giao dịch.</p>
          )}
        </div>
      </section>
    </div>
  );
}
