import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

/** Nhãn + ô nhập + dòng lỗi dưới ô, dùng chung cho các form lịch học của lớp. */
export function ScheduleField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Class cho `<select>` native, khớp ô chọn tổ chức của form tạo lớp. */
export const SELECT_CLASS_NAME =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50";
