"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const changeEmailSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
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
    if (!user.lastPasswordChange) return "Never changed";
    const date = new Date(user.lastPasswordChange);
    const now = new Date();
    const diffMonths = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    if (diffMonths === 0) return "Changed this month";
    if (diffMonths === 1) return "Changed 1 month ago";
    return `Changed ${diffMonths} months ago`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          Account Settings
        </h2>
        <p className="text-muted-foreground">
          Manage your account credentials and security
        </p>
      </div>

      {/* Email */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Email Address</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
            Change
          </Button>
        </div>
      </Card>

      {/* Password */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Password</p>
            <p className="text-sm text-muted-foreground">{formatLastPasswordChange()}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPasswordDialogOpen(true)}>
            Change
          </Button>
        </div>
      </Card>

      {/* 2FA */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Two-Factor Authentication
            </p>
            <p className="text-sm text-muted-foreground">
              {is2FAEnabled ? "Enabled" : "Add an extra layer of security"}
            </p>
          </div>
          <Switch
            checked={is2FAEnabled}
            onCheckedChange={handle2FAToggle}
            disabled={isLoading}
          />
        </div>
      </Card>

      {/* Delete Account */}
      <Card className="p-4 border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all data
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
            Delete
          </Button>
        </div>
      </Card>

      {/* Change Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
          </DialogHeader>
          <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
            <Input
              label="New Email Address"
              type="email"
              {...emailForm.register("newEmail")}
              error={emailForm.formState.errors.newEmail?.message}
            />
            <Input
              label="Current Password"
              type="password"
              {...emailForm.register("password")}
              error={emailForm.formState.errors.password?.message}
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEmailDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              {...passwordForm.register("currentPassword")}
              error={passwordForm.formState.errors.currentPassword?.message}
            />
            <Input
              label="New Password"
              type="password"
              {...passwordForm.register("newPassword")}
              error={passwordForm.formState.errors.newPassword?.message}
            />
            <Input
              label="Confirm New Password"
              type="password"
              {...passwordForm.register("confirmPassword")}
              error={passwordForm.formState.errors.confirmPassword?.message}
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Update Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete your account? This action cannot be undone.
            All your data, including courses, progress, and achievements will be
            permanently deleted.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
