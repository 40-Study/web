"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useLogoutAll } from "@/hooks/queries/use-auth";

/**
 * "Đăng xuất tất cả" có hộp xác nhận (P-07, QA3 261104). Trước đây bấm là gọi API ngay, đăng xuất luôn cả
 * thiết bị đang dùng mà không hỏi lại. Lỗi API hiện toast ở `useLogoutAll`. Dùng chung cho trang
 * `/settings/devices` và tab "Thiết bị" trong `/settings`.
 */
export function LogoutAllButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const logoutAll = useLogoutAll();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
        disabled={logoutAll.isPending}
      >
        <LogOut className="h-4 w-4 mr-1.5" aria-hidden="true" />
        {logoutAll.isPending ? "Đang xử lý..." : "Đăng xuất tất cả"}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Đăng xuất khỏi tất cả thiết bị?"
        description="Bạn sẽ bị đăng xuất khỏi mọi thiết bị, kể cả thiết bị này, và phải đăng nhập lại."
        confirmLabel="Đăng xuất tất cả"
        cancelLabel="Giữ nguyên"
        destructive
        pending={logoutAll.isPending}
        onConfirm={() => {
          setOpen(false);
          logoutAll.mutate();
        }}
      />
    </>
  );
}
