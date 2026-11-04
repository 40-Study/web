"use client";

import Link from "next/link";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { RoleSwitchList } from "@/components/layout/role-switch-list";
import { TEACHER_MENU_ITEMS, type TeacherMenuItem } from "@/components/layout/teacher-menu";

/**
 * Mục menu giảng viên KHÔNG có tab riêng ở bottom-nav (Q3-11). Lấy từ cùng `TEACHER_MENU_ITEMS` với sidebar
 * nên thêm trang mới vào sidebar là tự có mặt ở mobile, không phải sửa hai chỗ.
 */
export function getTeacherOverflowItems(tabHrefs: readonly string[]): TeacherMenuItem[] {
  const shown = new Set(tabHrefs);
  return TEACHER_MENU_ITEMS.filter((item) => !shown.has(item.href));
}

interface TeacherMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: TeacherMenuItem[];
}

/** Hộp "Khác" của bottom-nav giảng viên: các trang còn lại của sidebar + chuyển vai trò (hamburger không có). */
export function TeacherMoreSheet({ open, onOpenChange, items }: TeacherMoreSheetProps) {
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 max-h-[80vh] max-w-sm overflow-y-auto">
        <DialogTitle className="mb-3">Khác</DialogTitle>
        <nav aria-label="Trang giảng viên khác" className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 break-words">{item.label}</span>
            </Link>
          ))}
        </nav>
        <RoleSwitchList onSwitch={close} className="mt-4 border-t border-border pt-3" />
      </DialogContent>
    </Dialog>
  );
}
