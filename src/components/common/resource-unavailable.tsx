"use client";

import Link from "next/link";
import { AlertTriangle, ShieldAlert, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/errors";

/** Lỗi "không xem được": backend trả 404 khi không thấy, 403 khi thấy mà không có quyền (lane-rules). */
export function isResourceUnavailableError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 403 || error.status === 404);
}

interface ResourceUnavailableProps {
  /** 403 hiện "Không có quyền truy cập", còn lại hiện "Không tìm thấy". */
  status?: 403 | 404;
  /** Tên loại tài nguyên để câu chữ cụ thể: "khoá học", "lớp học", "bài tập"... */
  resourceLabel: string;
  backHref: string;
  backLabel: string;
}

/**
 * Trang thân thiện cho tài nguyên không tồn tại hoặc không có quyền xem. Trước đây các trang giảng viên mở
 * khoá/lớp không tồn tại (hoặc của giảng viên khác) hiện trang trắng hoặc bảng rỗng, như thể chưa có dữ liệu
 * (QA B-18). Backend cố ý trả cùng 404 cho "không tồn tại" và "không được thấy" nên câu chữ không phân biệt hai ca.
 */
export function ResourceUnavailable({ status = 404, resourceLabel, backHref, backLabel }: ResourceUnavailableProps) {
  const isForbidden = status === 403;
  const Icon = isForbidden ? ShieldAlert : SearchX;
  return (
    <div className="mx-auto mt-16 max-w-md space-y-4 text-center" role="alert">
      <Icon className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-lg font-semibold">
        {isForbidden ? "Không có quyền truy cập" : `Không tìm thấy ${resourceLabel}`}
      </h1>
      <p className="text-sm text-muted-foreground">
        {isForbidden
          ? `Bạn không có quyền xem ${resourceLabel} này.`
          : `${capitalize(resourceLabel)} không tồn tại hoặc bạn không có quyền xem.`}
      </p>
      <Button asChild>
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
}

/** Lỗi tải tạm thời (5xx, mất mạng): khác "không tìm thấy", người dùng nên thử lại thay vì tin khoá không tồn tại. */
export function ResourceLoadError({ resourceLabel, onRetry }: { resourceLabel: string; onRetry: () => void }) {
  return (
    <div className="mx-auto mt-16 max-w-md space-y-4 text-center" role="alert">
      <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-lg font-semibold">{`Không tải được ${resourceLabel}`}</h1>
      <p className="text-sm text-muted-foreground">Có lỗi khi kết nối tới máy chủ. Vui lòng thử lại.</p>
      <Button onClick={onRetry}>Thử lại</Button>
    </div>
  );
}

/** 403 giữ 403, mọi lỗi "không xem được" khác coi là 404. */
export function unavailableStatus(error: unknown): 403 | 404 {
  return error instanceof ApiError && error.status === 403 ? 403 : 404;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}