"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import {
  SettingsSidebar,
  AccountSettings,
  ProfileSettings,
  NotificationSettings,
  AppearanceSettings,
  PrivacySettings,
  DevicesSettings,
  LinkedAccountsSettings,
} from "@/components/settings";
import type { SettingsSection } from "@/components/settings";
import { useAuthStore } from "@/stores/auth.store";
import { useMe, useChangePassword, useDeleteAccount } from "@/hooks/queries/use-auth";
import { getDeviceInfo } from "@/services/auth.service";
import { appearanceStorage } from "@/lib/appearance-storage";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const { user } = useAuthStore();
  const { data: meData } = useMe();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    const deviceInfo = getDeviceInfo();
    await changePassword.mutateAsync({
      old_password: currentPassword,
      new_password: newPassword,
      confirm_password: newPassword,
      device_info: deviceInfo,
    });
  };

  const handleDeleteAccount = async (password: string) => {
    await deleteAccount.mutateAsync({ password });
  };

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return (
          <AccountSettings
            user={{ email: user?.email || "", has2FA: false, lastPasswordChange: meData?.password_changed_at }}
            onPasswordChange={handlePasswordChange}
            onDeleteAccount={handleDeleteAccount}
          />
        );
      case "profile":
        return <ProfileSettings />;
      case "notifications":
        return <NotificationSettings />;
      case "appearance":
        return (
          <AppearanceSettings
            initialTheme={appearanceStorage.getTheme() as "light" | "dark" | "system"}
            initialFontSize={appearanceStorage.getFontSize()}
            initialLanguage={appearanceStorage.getLanguage() as "vi" | "en"}
            onThemeChange={appearanceStorage.setTheme}
            onFontSizeChange={appearanceStorage.setFontSize}
            onLanguageChange={appearanceStorage.setLanguage}
          />
        );
      case "privacy":
        return <PrivacySettings />;
      case "devices":
        return <DevicesSettings />;
      case "linked":
        return <LinkedAccountsSettings />;
      default:
        return (
          <AccountSettings
            user={{ email: user?.email || "", has2FA: false, lastPasswordChange: meData?.password_changed_at }}
            onPasswordChange={handlePasswordChange}
            onDeleteAccount={handleDeleteAccount}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-50 rounded-2xl">
              <Settings className="h-7 w-7 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
              <p className="text-sm text-gray-500">Quản lý tài khoản và tùy chỉnh trải nghiệm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
          <div className="flex-1 min-w-0">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
