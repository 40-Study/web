"use client";

import { useState } from "react";
import { Bell, Mail, Smartphone } from "lucide-react";
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
    title: "Nhắc nhở chuỗi học",
    description: "Nhắc hàng ngày để duy trì chuỗi ngày học liên tiếp",
    email: true,
    push: true,
  },
  {
    id: "achievements",
    title: "Mở khóa thành tích",
    description: "Khi bạn đạt được thành tích mới",
    email: false,
    push: true,
  },
  {
    id: "course-updates",
    title: "Cập nhật khóa học",
    description: "Nội dung mới trong các khóa học đã đăng ký",
    email: true,
    push: true,
  },
  {
    id: "leaderboard",
    title: "Thay đổi bảng xếp hạng",
    description: "Thay đổi vị trí trong giải đấu của bạn",
    email: false,
    push: true,
  },
  {
    id: "marketing",
    title: "Khuyến mãi & Tin tức",
    description: "Ưu đãi đặc biệt và cập nhật nền tảng",
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

  const updateSetting = (settingId: string, channel: "email" | "push", value: boolean) => {
    const newSettings = settings.map((setting) =>
      setting.id === settingId ? { ...setting, [channel]: value } : setting
    );
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Thông báo</h2>
        <p className="text-sm text-gray-500 mt-1">Chọn loại thông báo bạn muốn nhận</p>
      </div>

      {/* Channel headers */}
      <div className="flex items-center gap-4 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <div className="flex-1" />
        <div className="w-16 text-center flex flex-col items-center gap-1">
          <Mail className="h-4 w-4" />
          <span>Email</span>
        </div>
        <div className="w-16 text-center flex flex-col items-center gap-1">
          <Smartphone className="h-4 w-4" />
          <span>Push</span>
        </div>
      </div>

      {/* Settings list */}
      <div className="space-y-3">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4"
          >
            <div className="p-2.5 bg-primary-50 rounded-xl shrink-0">
              <Bell className="h-4 w-4 text-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{setting.title}</p>
              <p className="text-xs text-gray-500 truncate">{setting.description}</p>
            </div>
            <div className="w-16 flex justify-center shrink-0">
              <Switch
                checked={setting.email}
                onCheckedChange={(v) => updateSetting(setting.id, "email", v)}
                aria-label={`${setting.title} — email`}
              />
            </div>
            <div className="w-16 flex justify-center shrink-0">
              <Switch
                checked={setting.push}
                onCheckedChange={(v) => updateSetting(setting.id, "push", v)}
                aria-label={`${setting.title} — push`}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 px-1">
        Bạn có thể hủy đăng ký nhận email bất cứ lúc nào bằng cách nhấn vào liên kết hủy đăng ký
        trong email.
      </p>
    </div>
  );
}
