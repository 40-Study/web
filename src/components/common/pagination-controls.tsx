"use client";

import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  page: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/** Trước/Sau cho danh sách phân trang của backend (`page`, `total_count`). Ẩn khi chỉ có một trang. */
export function PaginationControls({ page, totalCount, pageSize, onPageChange }: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Trước
      </Button>
      <span className="px-2 text-sm text-muted-foreground">
        Trang {page}/{totalPages}
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Sau
      </Button>
    </div>
  );
}
