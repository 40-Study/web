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

const changeEmailSchema = z.object({
  newEmail: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8, "Mật khẩu mới tối thiểu 8 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface AccountSettingsProps {
  user: {
    email: string;
    has2FA: boolean;
    lastPasswordChange?: Date | string;
  };
  onEmailChange?: (newEmail: string) => Promise<void>;
  onPasswordChange?: (currentPassword: string, newPassword: string) => Promise<void>;
  onToggle2FA?: (enabled: boolean) => Promise<void>;
  onDeleteAccount?: () => Promise<void>;
}

export function AccountSettings({
  user,
  onEmailChange,
  onPasswordChange,
  onToggle2FA,
  onDeleteAccount,
}: AccountSettingsProps) {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(user.has2FA);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const emailForm = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: "", password: "" },
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const handleEmailSubmit = async (data: ChangeEmailFormData) => {
    setIsLoading(true);
    try {
      await onEmailChange?.(data.newEmail);
      setEmailDialogOpen(false);
      emailForm.reset();
    } catch (error) {
      console.error("Failed to change email:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);
    try {
      await onPasswordChange?.(data.currentPassword, data.newPassword);
      setPasswordDialogOpen(false);
      passwordForm.reset();
    } catch (error) {
      console.error("Failed to change password:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAToggle = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      await onToggle2FA?.(enabled);
      setIs2FAEnabled(enabled);
    } catch (error) {
      console.error("Failed to toggle 2FA:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await onDeleteAccount?.();
    } catch (error) {
      console.error("Failed to delete account:", error);
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const formatLastPasswordChange = () => {
    if (!user.lastPasswordChange) return "Chưa đổi lần nào";
    const date = new Date(user.lastPasswordChange);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Đổi hôm nay";
    if (diffDays < 30) return `Đổi ${diffDays} ngày trước`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return "Đổi 1 tháng trước";
    return `Đổi ${diffMonths} tháng trước`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Tài khoản</h2>
        <p className="text-sm text-gray-500 mt-1">Quản lý thông tin đăng nhập và bảo mật</p>
      </div>

      {/* Email */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <Mail className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Địa chỉ email</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setEmailDialogOpen(true)}
          >
            Thay đổi
          </Button>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <Lock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Mật khẩu</p>
              <p className="text-sm text-gray-500">{formatLastPasswordChange()}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setPasswordDialogOpen(true)}
          >
            Đổi mật khẩu
          </Button>
        </div>
      </div>

      {/* 2FA */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-green-50 rounded-xl">
              <ShieldCheck className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Xác thực hai lớp (2FA)</p>
              <p className="text-sm text-gray-500">
                {is2FAEnabled ? "Đang bật — tài khoản được bảo vệ" : "Bảo vệ tài khoản an toàn hơn"}
              </p>
            </div>
          </div>
          <Switch checked={is2FAEnabled} onCheckedChange={handle2FAToggle} disabled={isLoading} />
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-red-50 rounded-xl">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="font-medium text-red-600">Xóa tài khoản</p>
              <p className="text-sm text-gray-500">Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu</p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-xl"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Xóa
          </Button>
        </div>
      </div>

      {/* Change Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Đổi địa chỉ email</DialogTitle>
          </DialogHeader>
          <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
            <Input
              label="Email mới"
              type="email"
              placeholder="your@email.com"
              {...emailForm.register("newEmail")}
              error={emailForm.formState.errors.newEmail?.message}
            />
            <Input
              label="Mật khẩu hiện tại"
              type="password"
              placeholder="Nhập mật khẩu để xác nhận"
              {...emailForm.register("password")}
              error={emailForm.formState.errors.password?.message}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setEmailDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isLoading}>
                {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
          </DialogHeader>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <div className="relative">
              <Input
                label="Mật khẩu hiện tại"
                type={showCurrentPw ? "text" : "password"}
                {...passwordForm.register("currentPassword")}
                error={passwordForm.formState.errors.currentPassword?.message}
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                onClick={() => setShowCurrentPw((v) => !v)}
              >
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="Mật khẩu mới"
                type={showNewPw ? "text" : "password"}
                {...passwordForm.register("newPassword")}
                error={passwordForm.formState.errors.newPassword?.message}
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                onClick={() => setShowNewPw((v) => !v)}
              >
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input
              label="Xác nhận mật khẩu mới"
              type="password"
              {...passwordForm.register("confirmPassword")}
              error={passwordForm.formState.errors.confirmPassword?.message}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setPasswordDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isLoading}>
                {isLoading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">Xóa tài khoản</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xóa tài khoản? Hành động này <strong>không thể hoàn tác</strong>.
            Toàn bộ dữ liệu bao gồm khóa học, tiến độ và thành tích sẽ bị xóa vĩnh viễn.
          </p>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={handleDeleteAccount}
              disabled={isLoading}
            >
              {isLoading ? "Đang xóa..." : "Xóa tài khoản"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
