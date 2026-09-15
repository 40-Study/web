"use client";

/**
 * Bảng phím tắt của player (contract §7), mở bằng `?`.
 *
 * Nhãn phím suy ra từ OS qua `keyboard-shortcut-label` — trên macOS hiện `⌘`, trên
 * Windows/Linux hiện `Ctrl`. Bảng này là nguồn duy nhất mô tả phím, nên khi thêm
 * phím mới chỉ cần sửa `shortcutDefinitions`.
 */

import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { shortcutTable, type ShortcutPlatform } from "@/lib/keyboard-shortcut-label";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: ShortcutPlatform;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
  platform,
}: KeyboardShortcutsDialogProps) {
  const rows = shortcutTable(platform);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-gray-500" aria-hidden="true" />
            Phím tắt
          </DialogTitle>
          <DialogDescription>
            Các phím tắt hoạt động khi con trỏ không nằm trong ô nhập liệu.
          </DialogDescription>
        </DialogHeader>

        <ul className="divide-y divide-gray-100">
          {rows.map((row) => (
            <li key={row.description} className="flex items-center justify-between gap-4 py-2.5">
              <div className="flex items-center gap-1.5">
                {row.keys.map((key, index) => (
                  <span key={`${row.description}-${key}-${index}`} className="flex items-center gap-1.5">
                    {index > 0 && <span className="text-xs text-gray-400">+</span>}
                    <kbd className="min-w-7 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-center text-xs font-medium text-gray-700">
                      {key}
                    </kbd>
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-600">{row.description}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
