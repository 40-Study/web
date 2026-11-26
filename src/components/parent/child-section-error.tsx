"use client";

import { Button } from "@/components/ui/button";

/**
 * Q8-PG-05: lỗi tải MỘT khối dữ liệu của con (tab hoặc widget). Trước đây tab Khoá học/Điểm số/Lịch học/Bài tập và thẻ
 * trang chủ chỉ đọc `isLoading` nên API lỗi hiện thành "Chưa đăng ký khoá học nào" / "Không có bài tập nào", phụ huynh
 * đọc sự cố thành "con tôi không có gì". Cùng mẫu với tab Điểm danh: nói là lỗi và cho thử lại.
 */
export function ChildSectionError({
  label,
  onRetry,
  compact = false,
}: {
  /** Tên khối, viết thường, đi sau "Không tải được": "danh sách khoá học", "điểm số"... */
  label: string;
  onRetry: () => void;
  /** Widget nhỏ trên thẻ trang chủ: một dòng chữ nhỏ thay vì khối căn giữa. */
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-2 text-xs text-red-700">
        <span>Không tải được {label}.</span>
        <button type="button" onClick={onRetry} className="font-medium underline underline-offset-2 hover:text-red-800">
          Thử lại
        </button>
      </div>
    );
  }
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-sm text-red-700">Không tải được {label}. Vui lòng thử lại.</p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Thử lại
      </Button>
    </div>
  );
}
