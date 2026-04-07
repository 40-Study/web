"use client";

import { Bell, Mail, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNotificationSettings, useUpdateNotificationSettings } from "@/hooks/queries/use-notification-settings";

// ─── Field mapping ───────────────────────────────────────────────────────────
// Maps UI items to backend field names for email + push channels

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  emailField: string | null;
  pushField: string | null;
}

const ITEMS: NotificationItem[] = [
  {
    id: "streak",
    title: "Nhắc nhở chuỗi học",
    description: "Nhắc hàng ngày để duy trì chuỗi ngày học liên tiếp",
    emailField: "email_recommendations",
    pushField: "push_streak_reminders",
  },
  {
    id: "achievements",
    title: "Mở khóa thành tích",
    description: "Khi bạn đạt được thành tích mới",
    emailField: null,
    pushField: "push_achievements",
  },
  {
    id: "course-updates",
    title: "Cập nhật khóa học",
    description: "Nội dung mới trong các khóa học đã đăng ký",
    emailField: "email_course_updates",
    pushField: "push_course_updates",
  },
  {
    id: "leaderboard",
    title: "Thay đổi bảng xếp hạng",
    description: "Thay đổi vị trí trong giải đấu của bạn",
    emailField: null,
    pushField: "push_quiz_reminders",
  },
  {
    id: "marketing",
    title: "Khuyến mãi & Tin tức",
    description: "Ưu đãi đặc biệt và cập nhật nền tảng",
    emailField: "email_promotions",
    pushField: "push_promotions",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function NotificationSettings() {
  const { data: settings, isLoading } = useNotificationSettings();
  const { mutate: updateSetting } = useUpdateNotificationSettings();

  const getValue = (field: string | null): boolean => {
    if (!field || !settings) return false;
    return settings[field] ?? false;
  };

  const handleToggle = (field: string | null, value: boolean) => {
    if (!field) return;
    updateSetting({ [field]: value });
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
        {ITEMS.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4"
          >
            <div className="p-2.5 bg-primary-50 rounded-xl shrink-0">
              <Bell className="h-4 w-4 text-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{item.title}</p>
              <p className="text-xs text-gray-500 truncate">{item.description}</p>
            </div>

            {/* Email toggle */}
            <div className="w-16 flex justify-center shrink-0">
              {item.emailField ? (
                <Switch
                  checked={getValue(item.emailField)}
                  onCheckedChange={(v) => handleToggle(item.emailField, v)}
                  disabled={isLoading}
                  aria-label={`${item.title} — email`}
                />
              ) : (
                <span className="text-gray-200 text-lg">—</span>
              )}
            </div>

            {/* Push toggle */}
            <div className="w-16 flex justify-center shrink-0">
              {item.pushField ? (
                <Switch
                  checked={getValue(item.pushField)}
                  onCheckedChange={(v) => handleToggle(item.pushField, v)}
                  disabled={isLoading}
                  aria-label={`${item.title} — push`}
                />
              ) : (
                <span className="text-gray-200 text-lg">—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 px-1">
        Bạn có thể hủy đăng ký nhận email bất cứ lúc nào bằng cách nhấn vào liên kết hủy đăng ký trong email.
      </p>
    </div>
  );
}
