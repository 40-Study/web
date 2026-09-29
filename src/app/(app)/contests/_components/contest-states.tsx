"use client";

/** Khối trạng thái dùng chung cho các trang cuộc thi: đang tải, lỗi (kèm thử lại), rỗng. */
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { contestErrorMessage } from "@/lib/contest/contest-errors";
import { cn } from "@/lib/utils";

export function ContestLoading({ label = "Đang tải cuộc thi…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

interface ContestErrorStateProps {
  error?: unknown;
  /** Câu hiển thị thay cho câu suy từ `error`. */
  message?: string;
  title?: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function ContestErrorState({
  error,
  message,
  title = "Không tải được dữ liệu",
  onRetry,
  backHref = "/contests",
  backLabel = "Về danh sách cuộc thi",
  className,
}: ContestErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn("mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-6 text-center", className)}
    >
      <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden="true" />
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-600">{message ?? contestErrorMessage(error)}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Thử lại
          </Button>
        )}
        <Link href={backHref} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
