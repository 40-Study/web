"use client";

import Link from "next/link";
import { useLogout } from "@/hooks/queries/use-auth";
import {
  User,
  Bell,
  Palette,
  Shield,
  Link2,
  Smartphone,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SettingsSection =
  | "account"
  | "profile"
  | "notifications"
  | "appearance"
  | "privacy"
  | "devices"
  | "linked";

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  className?: string;
}

interface NavItem {
  id: SettingsSection;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: "account", label: "Tài khoản", description: "Email, mật khẩu, bảo mật", icon: User },
  { id: "profile", label: "Hồ sơ", description: "Tên, ảnh đại diện, tiểu sử", icon: User },
  { id: "notifications", label: "Thông báo", description: "Email, push, nhắc nhở", icon: Bell },
  { id: "appearance", label: "Giao diện", description: "Chủ đề, phông chữ, ngôn ngữ", icon: Palette },
  { id: "privacy", label: "Quyền riêng tư", description: "Hiển thị hồ sơ, hoạt động", icon: Shield },
  { id: "devices", label: "Thiết bị", description: "Quản lý phiên đăng nhập", icon: Smartphone },
  { id: "linked", label: "Liên kết tài khoản", description: "Google, Facebook, GitHub", icon: Link2 },
];

export function SettingsSidebar({
  activeSection,
  onSectionChange,
  className,
}: SettingsSidebarProps) {
  const logoutMutation = useLogout();

  return (
    <nav className={cn("w-full md:w-72 shrink-0", className)}>
      <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    isActive ? "bg-primary-100" : "bg-gray-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  <p
                    className={cn(
                      "text-xs truncate",
                      isActive ? "text-primary-500" : "text-gray-400"
                    )}
                  >
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
          <Link
            href="/help"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-gray-100 rounded-lg">
              <HelpCircle className="h-4 w-4" />
            </div>
            Trợ giúp & Hỗ trợ
          </Link>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            <div className="p-2 bg-red-50 rounded-lg">
              <LogOut className="h-4 w-4" />
            </div>
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}
