"use client";

import { useMemo, useState } from "react";
import { financialReportMockData, type FinancialRecord, type PaymentStatus } from "./financial-report-mock-data";

type ReportFilter = "today" | "7days" | "all";

const statusList: PaymentStatus[] = ["Succeeded", "Pending", "Failed", "Refunded"];

const defaultForm = {
  transactionId: "",
  courseName: "",
  studentName: "",
  studentEmail: "",
  amount: "",
  fee: "",
  gateway: "SEPAY" as FinancialRecord["gateway"],
  status: "Succeeded" as PaymentStatus,
  paidAt: "",
  note: "",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const formatDate = (iso: string) => new Date(iso).toLocaleString("vi-VN");

export default function AdminReportsPage() {
  const [records, setRecords] = useState<FinancialRecord[]>(financialReportMockData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [period, setPeriod] = useState<ReportFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(financialReportMockData[0]?.id || null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const filteredRecords = useMemo(() => {
    const now = Date.now();
    return records.filter((record) => {
      const textMatched =
        record.transactionId.toLowerCase().includes(search.toLowerCase()) ||
        record.courseName.toLowerCase().includes(search.toLowerCase()) ||
        record.studentName.toLowerCase().includes(search.toLowerCase()) ||
        record.studentEmail.toLowerCase().includes(search.toLowerCase());

      const statusMatched = statusFilter === "ALL" ? true : record.status === statusFilter;

      const timestamp = new Date(record.paidAt).getTime();
      const periodMatched =
        period === "today"
          ? now - timestamp <= 24 * 60 * 60 * 1000
          : period === "7days"
            ? now - timestamp <= 7 * 24 * 60 * 60 * 1000
            : true;

      return textMatched && statusMatched && periodMatched;
    });
  }, [period, records, search, statusFilter]);

  const selectedRecord = useMemo(
    () => filteredRecords.find((item) => item.id === selectedId) || filteredRecords[0] || null,
    [filteredRecords, selectedId]
  );

  const metrics = useMemo(() => {
    const successful = filteredRecords.filter((r) => r.status === "Succeeded");
    const revenue = successful.reduce((sum, item) => sum + item.amount, 0);
    const netRevenue = successful.reduce((sum, item) => sum + (item.amount - item.fee), 0);
    const refunded = filteredRecords.filter((r) => r.status === "Refunded").reduce((sum, item) => sum + item.amount, 0);
    const successRate = filteredRecords.length ? (successful.length / filteredRecords.length) * 100 : 0;
    return {
      revenue,
      netRevenue,
      refunded,
      transactions: filteredRecords.length,
      successRate,
      activeStudents: new Set(successful.map((x) => x.studentEmail)).size,
    };
  }, [filteredRecords]);

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultForm);
  };

  const fillEditForm = (record: FinancialRecord) => {
    setEditingId(record.id);
    setForm({
      transactionId: record.transactionId,
      courseName: record.courseName,
      studentName: record.studentName,
      studentEmail: record.studentEmail,
      amount: String(record.amount),
      fee: String(record.fee),
      gateway: record.gateway,
      status: record.status,
      paidAt: record.paidAt.slice(0, 16),
      note: record.note || "",
    });
  };

  const upsertRecord = () => {
    if (!form.transactionId || !form.courseName || !form.studentName || !form.studentEmail || !form.amount || !form.paidAt) return;

    const payload: FinancialRecord = {
      id: editingId || `${Date.now()}`,
      transactionId: form.transactionId,
      courseName: form.courseName,
      studentName: form.studentName,
      studentEmail: form.studentEmail,
      amount: Number(form.amount),
      fee: Number(form.fee || 0),
      gateway: form.gateway,
      status: form.status,
      paidAt: new Date(form.paidAt).toISOString(),
      note: form.note || undefined,
    };

    if (editingId) {
      setRecords((prev) => prev.map((item) => (item.id === editingId ? payload : item)));
      setSelectedId(editingId);
    } else {
      setRecords((prev) => [payload, ...prev]);
      setSelectedId(payload.id);
    }

    resetForm();
  };

  const deleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((item) => item.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) resetForm();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Báo cáo tài chính</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Dashboard doanh thu + danh sách giao dịch chi tiết, mock data lớn, CRUD đầy đủ.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Card label="Gross Revenue" value={formatCurrency(metrics.revenue)} />
        <Card label="Net Revenue" value={formatCurrency(metrics.netRevenue)} />
        <Card label="Refund Amount" value={formatCurrency(metrics.refunded)} />
        <Card label="Transactions" value={String(metrics.transactions)} />
        <Card label="Success Rate" value={`${metrics.successRate.toFixed(1)}%`} />
        <Card label="Active Students" value={String(metrics.activeStudents)} />
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="grid gap-3 lg:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo transaction, khóa học, học viên..."
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "ALL")}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {statusList.map((item) => (
              <option key={item} value={item}>{item}</option>
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
          <button
            onClick={resetForm}
            className="h-10 rounded-lg bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700"
          >
            Tạo giao dịch mới
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left">Transaction</th>
                  <th className="px-4 py-3 text-left">Course</th>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className={selectedRecord?.id === record.id ? "bg-primary-50/60 dark:bg-primary-900/20" : ""}
                  >
                    <td className="px-4 py-3 font-medium">{record.transactionId}</td>
                    <td className="px-4 py-3">{record.courseName}</td>
                    <td className="px-4 py-3">{record.studentName}</td>
                    <td className="px-4 py-3">{formatCurrency(record.amount)}</td>
                    <td className="px-4 py-3">{record.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedId(record.id)}
                          className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 dark:bg-gray-800"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => fillEditForm(record)}
                          className="rounded bg-primary-100 px-2 py-1 text-xs text-primary-700 hover:bg-primary-200"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => deleteRecord(record.id)}
                          className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-base font-semibold">{editingId ? "Cập nhật giao dịch" : "Tạo giao dịch"}</h2>
            <div className="mt-3 grid gap-2">
              <Input label="Transaction ID" value={form.transactionId} onChange={(v) => setForm((p) => ({ ...p, transactionId: v }))} />
              <Input label="Tên khóa học" value={form.courseName} onChange={(v) => setForm((p) => ({ ...p, courseName: v }))} />
              <Input label="Tên học viên" value={form.studentName} onChange={(v) => setForm((p) => ({ ...p, studentName: v }))} />
              <Input label="Email học viên" value={form.studentEmail} onChange={(v) => setForm((p) => ({ ...p, studentEmail: v }))} />
              <Input label="Số tiền" value={form.amount} onChange={(v) => setForm((p) => ({ ...p, amount: v }))} type="number" />
              <Input label="Phí giao dịch" value={form.fee} onChange={(v) => setForm((p) => ({ ...p, fee: v }))} type="number" />
              <Input label="Thời gian thanh toán" value={form.paidAt} onChange={(v) => setForm((p) => ({ ...p, paidAt: v }))} type="datetime-local" />
              <Input label="Ghi chú" value={form.note} onChange={(v) => setForm((p) => ({ ...p, note: v }))} />

              <select
                value={form.gateway}
                onChange={(e) => setForm((p) => ({ ...p, gateway: e.target.value as FinancialRecord["gateway"] }))}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="SEPAY">SEPAY</option>
                <option value="MOMO">MOMO</option>
                <option value="VNPAY">VNPAY</option>
                <option value="BANK_TRANSFER">BANK_TRANSFER</option>
              </select>

              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as PaymentStatus }))}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                {statusList.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <div className="mt-2 flex gap-2">
                <button onClick={upsertRecord} className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700">
                  {editingId ? "Lưu cập nhật" : "Tạo mới"}
                </button>
                <button onClick={resetForm} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200 dark:bg-gray-800">
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-base font-semibold">Chi tiết giao dịch</h2>
            {selectedRecord ? (
              <div className="mt-3 space-y-2 text-sm">
                <DetailRow label="Transaction ID" value={selectedRecord.transactionId} />
                <DetailRow label="Khóa học" value={selectedRecord.courseName} />
                <DetailRow label="Học viên" value={`${selectedRecord.studentName} (${selectedRecord.studentEmail})`} />
                <DetailRow label="Gateway" value={selectedRecord.gateway} />
                <DetailRow label="Amount" value={formatCurrency(selectedRecord.amount)} />
                <DetailRow label="Fee" value={formatCurrency(selectedRecord.fee)} />
                <DetailRow label="Net" value={formatCurrency(selectedRecord.amount - selectedRecord.fee)} />
                <DetailRow label="Status" value={selectedRecord.status} />
                <DetailRow label="Paid at" value={formatDate(selectedRecord.paidAt)} />
                <DetailRow label="Note" value={selectedRecord.note || "-"} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Chưa chọn giao dịch.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </article>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-gray-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
      />
    </label>
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
