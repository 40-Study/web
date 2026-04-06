"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, ShieldCheck, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// ─── Schemas ────────────────────────────────────────────────────────────────

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8, "Mật khẩu mới tối thiểu 8 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Vui lòng nhập mật khẩu để xác nhận"),
});

type ChangePasswordData = z.infer<typeof changePasswordSchema>;
type DeleteAccountData = z.infer<typeof deleteAccountSchema>;

// ─── Props ──────────────────────────────────────────────────────────────────

interface AccountSettingsProps {
  user: { email: string; has2FA: boolean; lastPasswordChange?: Date | string };
  onPasswordChange?: (currentPassword: string, newPassword: string) => Promise<void>;
  onDeleteAccount?: (password: string) => Promise<void>;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AccountSettings({
  user,
  onPasswordChange,
  onDeleteAccount,
}: AccountSettingsProps) {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const passwordForm = useForm<ChangePasswordData>({ resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });
  const deleteForm = useForm<DeleteAccountData>({ resolver: zodResolver(deleteAccountSchema), defaultValues: { password: "" } });

  const handlePasswordSubmit = async (data: ChangePasswordData) => {
    setIsLoading(true);
    try {
      await onPasswordChange?.(data.currentPassword, data.newPassword);
      setPasswordDialogOpen(false);
      passwordForm.reset();
    } catch { /* toast shown in hook */ } finally { setIsLoading(false); }
  };

  const handleDeleteSubmit = async (data: DeleteAccountData) => {
    setIsLoading(true);
    try {
      await onDeleteAccount?.(data.password);
    } catch { /* toast shown in hook */ } finally { setIsLoading(false); setDeleteDialogOpen(false); }
  };

  const formatLastPasswordChange = () => {
    if (!user.lastPasswordChange) return "Chưa đổi lần nào";
    const date = new Date(user.lastPasswordChange);
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (diffDays === 0) return "Đổi hôm nay";
    if (diffDays < 30) return `Đổi ${diffDays} ngày trước`;
    return `Đổi ${Math.floor(diffDays / 30)} tháng trước`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Tài khoản</h2>
        <p className="text-sm text-gray-500 mt-1">Quản lý thông tin đăng nhập và bảo mật</p>
      </div>

      {/* Email — display only */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-blue-50 rounded-xl"><Mail className="h-5 w-5 text-blue-500" /></div>
          <div>
            <p className="font-medium text-gray-900">Địa chỉ email</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-amber-50 rounded-xl"><Lock className="h-5 w-5 text-amber-500" /></div>
            <div>
              <p className="font-medium text-gray-900">Mật khẩu</p>
              <p className="text-sm text-gray-500">{formatLastPasswordChange()}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setPasswordDialogOpen(true)}>
            Đổi mật khẩu
          </Button>
        </div>
      </div>

      {/* 2FA — coming soon */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm opacity-70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-green-50 rounded-xl"><ShieldCheck className="h-5 w-5 text-green-500" /></div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">Xác thực hai lớp (2FA)</p>
                <Badge variant="secondary" className="text-xs">Sắp ra mắt</Badge>
              </div>
              <p className="text-sm text-gray-500">Bảo vệ tài khoản an toàn hơn</p>
            </div>
          </div>
          <Switch checked={false} disabled aria-label="2FA — chưa khả dụng" />
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-red-50 rounded-xl"><Trash2 className="h-5 w-5 text-red-500" /></div>
            <div>
              <p className="font-medium text-red-600">Xóa tài khoản</p>
              <p className="text-sm text-gray-500">Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => setDeleteDialogOpen(true)}>
            Xóa
          </Button>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Đổi mật khẩu</DialogTitle></DialogHeader>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <div className="relative">
              <Input label="Mật khẩu hiện tại" type={showCurrentPw ? "text" : "password"} {...passwordForm.register("currentPassword")} error={passwordForm.formState.errors.currentPassword?.message} />
              <button type="button" className="absolute right-3 top-9 text-gray-400 hover:text-gray-600" onClick={() => setShowCurrentPw((v) => !v)}>
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <Input label="Mật khẩu mới" type={showNewPw ? "text" : "password"} {...passwordForm.register("newPassword")} error={passwordForm.formState.errors.newPassword?.message} />
              <button type="button" className="absolute right-3 top-9 text-gray-400 hover:text-gray-600" onClick={() => setShowNewPw((v) => !v)}>
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input label="Xác nhận mật khẩu mới" type="password" {...passwordForm.register("confirmPassword")} error={passwordForm.formState.errors.confirmPassword?.message} />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setPasswordDialogOpen(false)}>Hủy</Button>
              <Button type="submit" className="rounded-xl" disabled={isLoading}>{isLoading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog — requires password */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="text-red-600">Xóa tài khoản</DialogTitle></DialogHeader>
          <p className="text-gray-600 text-sm">
            Hành động này <strong>không thể hoàn tác</strong>. Toàn bộ dữ liệu bao gồm khóa học, tiến độ và thành tích sẽ bị xóa vĩnh viễn.
          </p>
          <form onSubmit={deleteForm.handleSubmit(handleDeleteSubmit)} className="space-y-4 mt-2">
            <Input label="Mật khẩu xác nhận" type="password" placeholder="Nhập mật khẩu để xác nhận" {...deleteForm.register("password")} error={deleteForm.formState.errors.password?.message} />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
              <Button type="submit" variant="destructive" className="rounded-xl" disabled={isLoading}>{isLoading ? "Đang xóa..." : "Xóa tài khoản"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
