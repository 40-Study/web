"use client";

/**
 * Báo lỗi tải kèm nút "Thử lại" cho các thẻ Gia đình (review #38 W2): trước đây thẻ trả `null`
 * khi lỗi, nên học sinh không biết mình đang có yêu cầu liên kết chờ xác nhận.
 */
export function FamilyLoadError({ what, onRetry, className }: { what: string; onRetry: () => void; className?: string }) {
  return (
    <div className={className}>
      <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        Không tải được {what}.{" "}
        <button type="button" className="font-medium underline" onClick={onRetry}>
          Thử lại
        </button>
      </p>
    </div>
  );
}
