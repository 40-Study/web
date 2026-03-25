"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  SettingsSidebar,
  AccountSettings,
  NotificationSettings,
  AppearanceSettings,
} from "@/components/settings";
import type { SettingsSection, NotificationSetting } from "@/components/settings";

// Mock user data - replace with API calls
const MOCK_USER = {
  email: "minh@example.com",
  has2FA: false,
  lastPasswordChange: new Date("2024-12-01"),
};

const MOCK_NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    id: "streak",
    title: "Streak Reminders",
    description: "Daily reminder to maintain your streak",
    email: true,
    push: true,
  },
  {
    id: "achievements",
    title: "Achievement Unlocks",
    description: "When you earn a new achievement",
    email: false,
    push: true,
  },
  {
    id: "course-updates",
    title: "Course Updates",
    description: "New content in enrolled courses",
    email: true,
    push: true,
  },
  {
    id: "leaderboard",
    title: "Leaderboard Changes",
    description: "Position changes in your league",
    email: false,
    push: true,
  },
  {
    id: "marketing",
    title: "Promotions & News",
    description: "Special offers and platform updates",
    email: true,
    push: false,
  },
];

// Privacy settings component
function PrivacySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          Privacy
        </h2>
        <p className="text-muted-foreground">Control your privacy settings</p>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Profile Visibility
              </p>
              <p className="text-sm text-muted-foreground">
                Allow others to see your profile
              </p>
            </div>
            <select className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Show Activity Status
              </p>
              <p className="text-sm text-muted-foreground">
                Let others see when you are learning
              </p>
            </div>
            <select className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="everyone">Everyone</option>
              <option value="friends">Friends Only</option>
              <option value="none">No One</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Leaderboard Visibility
              </p>
              <p className="text-sm text-muted-foreground">
                Show your name on public leaderboards
              </p>
            </div>
            <select className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="name">Show Name</option>
              <option value="username">Show Username</option>
              <option value="anonymous">Anonymous</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Linked accounts component
function LinkedAccountsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          Linked Accounts
        </h2>
        <p className="text-muted-foreground">Connect your social accounts</p>
      </div>

      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#4285F4] flex items-center justify-center">
                <span className="text-white font-bold">G</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Google</p>
                <p className="text-sm text-muted-foreground">Not connected</p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-600 rounded-md hover:bg-primary-50 transition-colors">
              Connect
            </button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
                <span className="text-white font-bold">f</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Facebook</p>
                <p className="text-sm text-muted-foreground">Not connected</p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-600 rounded-md hover:bg-primary-50 transition-colors">
              Connect
            </button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#333] dark:bg-white flex items-center justify-center">
                <span className="text-white dark:text-black font-bold">GH</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">GitHub</p>
                <p className="text-sm text-muted-foreground">Not connected</p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-600 rounded-md hover:bg-primary-50 transition-colors">
              Connect
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");

  const handleEmailChange = async (newEmail: string) => {
    console.log("Changing email to:", newEmail);
    // API call would go here
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    console.log("Changing password");
    // API call would go here
  };

  const handleToggle2FA = async (enabled: boolean) => {
    console.log("Toggling 2FA:", enabled);
    // API call would go here
  };

  const handleDeleteAccount = async () => {
    console.log("Deleting account");
    // API call would go here
  };

  const handleNotificationChange = (settings: NotificationSetting[]) => {
    console.log("Notification settings changed:", settings);
    // API call would go here
  };

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    console.log("Theme changed:", theme);
    // Would update theme context/localStorage here
  };

  const handleFontSizeChange = (fontSize: number) => {
    console.log("Font size changed:", fontSize);
    // Would update user preferences here
  };

  const handleLanguageChange = (language: "vi" | "en") => {
    console.log("Language changed:", language);
    // Would update i18n context here
  };

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return (
          <AccountSettings
            user={MOCK_USER}
            onEmailChange={handleEmailChange}
            onPasswordChange={handlePasswordChange}
            onToggle2FA={handleToggle2FA}
            onDeleteAccount={handleDeleteAccount}
          />
        );
      case "notifications":
        return (
          <NotificationSettings
            initialSettings={MOCK_NOTIFICATION_SETTINGS}
            onSettingsChange={handleNotificationChange}
          />
        );
      case "appearance":
        return (
          <AppearanceSettings
            onThemeChange={handleThemeChange}
            onFontSizeChange={handleFontSizeChange}
            onLanguageChange={handleLanguageChange}
          />
        );
      case "privacy":
        return <PrivacySettings />;
      case "linked":
        return <LinkedAccountsSettings />;
      default:
        return (
          <AccountSettings
            user={MOCK_USER}
            onEmailChange={handleEmailChange}
            onPasswordChange={handlePasswordChange}
            onToggle2FA={handleToggle2FA}
            onDeleteAccount={handleDeleteAccount}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <SettingsSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          {/* Main Content */}
          <div className="flex-1">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
