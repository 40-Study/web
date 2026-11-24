"use client";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/errors";

/**
 * QA6-A06: trang chi tiết admin mở bằng id không có thật. Backend (C8) trả 404 `ERR_NOT_FOUND` cho id lạ và
 * 400 `ERR_INVALID_ID` cho id sai định dạng; cả hai là kết quả cuối cùng, không phải lỗi tạm, nên "Thử lại" vô nghĩa.
 */
export function isMissingResourceError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 400);
}

interface AdminNotFoundProps {
  title: string;
  description: string;
  backLabel: string;
  onBack: () => void;
}

/** Trạng thái "không tìm thấy" kèm đường về danh sách (dùng thay khối lỗi chung + "Thử lại"). */
export function AdminNotFound({ title, description, backLabel, onBack }: AdminNotFoundProps) {
  return (
    <div role="status" className="rounded-xl border bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <Button className="mt-4" variant="outline" onClick={onBack}>
        {backLabel}
      </Button>
    </div>
  );
}
