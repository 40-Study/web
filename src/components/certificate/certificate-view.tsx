"use client";

import { cn } from "@/lib/utils";

/**
 * Bản render chứng chỉ để xem + in/lưu PDF.
 *
 * Vì sao HTML + CSS print thay vì canvas/konva (plan gốc đề xuất konva -> PNG):
 * - Không thêm dependency nào; trình duyệt đã có sẵn "In → Lưu thành PDF".
 * - Ra PDF vector, chữ sắc nét ở mọi khổ giấy; canvas chỉ cho ảnh raster.
 * - Dùng lại được font/màu của hệ thống thiết kế, không phải vẽ tay từng chữ.
 * `certificate_url` từ backend hiện luôn null (queue sinh PDF không có
 * consumer), nên đây là đường chính để lấy bản chứng chỉ, không phải phương án dự phòng.
 */

function formatIssuedDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
}

export function CertificateView({
  userName,
  courseName,
  certificateNumber,
  issuedAt,
  verifyUrl,
  className,
}: {
  userName: string;
  courseName: string;
  certificateNumber: string;
  issuedAt?: string;
  verifyUrl?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "certificate-sheet relative mx-auto w-full max-w-3xl overflow-hidden rounded-xl border-[6px] border-double border-primary-600 bg-white p-8 text-center shadow-sm sm:p-12",
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600">
        ForteX
      </p>

      <h1 className="mt-6 text-2xl font-semibold tracking-wide text-gray-900 sm:text-3xl">
        CHỨNG NHẬN HOÀN THÀNH
      </h1>

      <p className="mt-6 text-sm text-gray-500">Chứng nhận rằng</p>
      <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
        {userName}
      </p>

      <p className="mt-5 text-sm text-gray-500">đã hoàn thành khóa học</p>
      <p className="mt-2 text-xl font-semibold text-primary-700 sm:text-2xl">
        {courseName}
      </p>

      {issuedAt && (
        <p className="mt-6 text-sm text-gray-600">
          Cấp ngày {formatIssuedDate(issuedAt)}
        </p>
      )}

      <div className="mt-8 border-t border-gray-200 pt-4 text-xs text-gray-500">
        <p>
          Mã chứng chỉ:{" "}
          <span className="font-mono font-medium text-gray-700">
            {certificateNumber}
          </span>
        </p>
        {verifyUrl && (
          <p className="mt-1 break-all">Xác minh tại: {verifyUrl}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Nút in — trình duyệt mở hộp thoại in, người dùng chọn "Lưu thành PDF".
 * CSS print ẩn mọi thứ trừ .certificate-sheet (xem globals.css).
 */
export function CertificatePrintButton({ label = "Tải / In chứng chỉ" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
    >
      {label}
    </button>
  );
}
