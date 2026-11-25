"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useAuthStore, type UnifiedRole } from "@/stores/auth.store";
import { useMe, useChangePassword, useDeleteAccount, useSwitchRole } from "@/hooks/queries/use-auth";
import { getDeviceInfo } from "@/services/auth.service";
import { appearanceStorage } from "@/lib/appearance-storage";

const SECTIONS: readonly SettingsSection[] = ["account", "profile", "notifications", "appearance", "privacy", "devices", "linked"];

// `useSearchParams` cần ranh giới Suspense (trang bị tạo tĩnh); vỏ này chỉ bọc phần nội dung.
export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  // Liên kết sâu `/settings?section=profile` (nút "Chỉnh sửa hồ sơ" ở trang hồ sơ). Đọc ngay ở lần render đầu
  // (không qua effect) nên không có một khung hình hiện "Tài khoản" trước khi nhảy sang "Hồ sơ"; giá trị lạ bị
  // bỏ qua, ở lại mục mặc định.
  const router = useRouter();
  const wanted = useSearchParams().get("section");
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    () => SECTIONS.find((s) => s === wanted) ?? "account",
  );
  const contentRef = useRef<HTMLDivElement>(null);

  // Q7-PG-01/02: chọn mục thì (1) ghi `?section=` lên URL bằng replace (tải lại không về "Tài khoản", không thêm mục lịch
  // sử), (2) dưới `md` danh sách mục xếp TRÊN nội dung nên nội dung hiện dưới màn hình: cuộn tới nó, nếu không thì chạm
  // vào một mục trông như không có gì xảy ra. Từ `md` hai cột đứng cạnh nhau, không cuộn.
  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
    router.replace(section === "account" ? "/settings" : `/settings?section=${section}`, { scroll: false });
    if (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() => contentRef.current?.scrollIntoView?.({ block: "start", behavior: "smooth" }));
    }
  };
  const { user } = useAuthStore();
  const { data: meData } = useMe();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();
  const switchRole = useSwitchRole();

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

  const handleSwitchRole = async (role: UnifiedRole) => {
    await switchRole.mutateAsync({
      role_id: role.id,
      role_type: role.type,
      organization_id: role.organization_id || undefined,
    });
  };

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return (
          <AccountSettings
            user={{ email: user?.email || "", has2FA: false, lastPasswordChange: meData?.password_changed_at }}
            onPasswordChange={handlePasswordChange}
            onDeleteAccount={handleDeleteAccount}
            onSwitchRole={handleSwitchRole}
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
            onSwitchRole={handleSwitchRole}
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
              <p className="text-sm text-gray-500">Quản lý tài khoản và tuỳ chỉnh trải nghiệm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <SettingsSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
          <div ref={contentRef} className="flex-1 min-w-0 scroll-mt-20">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
