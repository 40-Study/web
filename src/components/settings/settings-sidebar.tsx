"use client";

import Link from "next/link";
import {
  User,
  Bell,
  Palette,
  Shield,
  Link2,
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
  | "security"
  | "linked";

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  className?: string;
}

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: "account", label: "Account", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "linked", label: "Linked Accounts", icon: Link2 },
];

export function SettingsSidebar({
  activeSection,
  onSectionChange,
  className,
}: SettingsSidebarProps) {
  return (
    <nav className={cn("w-full md:w-64 shrink-0", className)}>
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-1">
        <Link
          href="/help"
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <HelpCircle className="h-5 w-5" />
          Help & Support
        </Link>
        <button
          onClick={() => {
            // Handle logout
            console.log("Logout clicked");
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </button>
      </div>
    </nav>
  );
}
