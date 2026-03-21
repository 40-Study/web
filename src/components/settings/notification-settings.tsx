"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  email: boolean;
  push: boolean;
}

const defaultSettings: NotificationSetting[] = [
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

interface NotificationSettingsProps {
  initialSettings?: NotificationSetting[];
  onSettingsChange?: (settings: NotificationSetting[]) => void;
}

export function NotificationSettings({
  initialSettings = defaultSettings,
  onSettingsChange,
}: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSetting[]>(initialSettings);

  const updateSetting = (
    settingId: string,
    channel: "email" | "push",
    value: boolean
  ) => {
    const newSettings = settings.map((setting) =>
      setting.id === settingId ? { ...setting, [channel]: value } : setting
    );
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          Notifications
        </h2>
        <p className="text-muted-foreground">Choose what notifications you receive</p>
      </div>

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground px-4">
          <div className="flex-1" />
          <div className="w-16 text-center">Email</div>
          <div className="w-16 text-center">Push</div>
        </div>

        {/* Settings */}
        {settings.map((setting) => (
          <Card key={setting.id} className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {setting.title}
                </p>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <div className="w-16 flex justify-center">
                <Switch
                  checked={setting.email}
                  onCheckedChange={(v) => updateSetting(setting.id, "email", v)}
                  aria-label={`${setting.title} email notifications`}
                />
              </div>
              <div className="w-16 flex justify-center">
                <Switch
                  checked={setting.push}
                  onCheckedChange={(v) => updateSetting(setting.id, "push", v)}
                  aria-label={`${setting.title} push notifications`}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Note: You can unsubscribe from email notifications at any time by clicking the
        unsubscribe link in any email.
      </p>
    </div>
  );
}
