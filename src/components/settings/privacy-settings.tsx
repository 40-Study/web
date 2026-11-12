"use client";

import { Eye, Users, Trophy } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePrivacySettings, useUpdatePrivacySettings } from "@/hooks/queries/use-user-preferences";
import type { PrivacySettingKey } from "@/services/user-preference.service";
import { useAuthStore } from "@/stores/auth.store";
import { normalizeRole } from "@/lib/routes";

// ─── Static config ───────────────────────────────────────────────────────────

interface PrivacyOption {
  // Khoá của backend (PrivacySettingKey): gõ sai tên là lỗi biên dịch thay vì lựa chọn không được lưu.
  id: PrivacySettingKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  options: { value: string; label: string }[];
  defaultValue: string;
  /** Hàng chỉ có nghĩa với người học: phụ huynh không có bảng xếp hạng, không "đang học" (P-05, QA3 261104). */
  hideForParent?: boolean;
}

const privacyOptions: PrivacyOption[] = [
  {
    id: "profile_visibility",
    label: "Hiển thị hồ sơ",
    description: "Ai có thể xem hồ sơ của bạn",
    icon: Eye,
    iconBg: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-500",
    options: [
      { value: "public", label: "Công khai" },
      { value: "friends", label: "Chỉ bạn bè" },
      { value: "private", label: "Riêng tư" },
    ],
    defaultValue: "public",
  },
  {
    id: "activity_status",
    label: "Trạng thái hoạt động",
    description: "Cho người khác biết khi bạn đang học",
    icon: Users,
    iconBg: "bg-green-50 dark:bg-green-500/10",
    iconColor: "text-green-500",
    options: [
      { value: "everyone", label: "Mọi người" },
      { value: "friends", label: "Chỉ bạn bè" },
      { value: "none", label: "Không ai" },
    ],
    defaultValue: "everyone",
    hideForParent: true,
  },
  {
    id: "leaderboard_display",
    label: "Bảng xếp hạng",
    description: "Hiển thị tên bạn trên bảng xếp hạng công khai",
    icon: Trophy,
    iconBg: "bg-amber-50 dark:bg-amber-500/10",
    iconColor: "text-amber-500",
    options: [
      { value: "name", label: "Hiển thị tên" },
      { value: "username", label: "Hiển thị username" },
      { value: "anonymous", label: "Ẩn danh" },
    ],
    defaultValue: "name",
    hideForParent: true,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function PrivacySettings() {
  const { data: settings, isLoading } = usePrivacySettings();
  const { mutate: updateSetting } = useUpdatePrivacySettings();
  const isParent = normalizeRole(useAuthStore((s) => s.activeRole)) === "PARENT";
  const visibleOptions = privacyOptions.filter((o) => !(isParent && o.hideForParent));

  const getValue = (id: PrivacySettingKey): string => {
    if (!settings) return privacyOptions.find((o) => o.id === id)?.defaultValue ?? "";
    return settings[id] ?? privacyOptions.find((o) => o.id === id)?.defaultValue ?? "";
  };

  const handleChange = (id: PrivacySettingKey, value: string) => {
    updateSetting({ [id]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Quyền riêng tư</h2>
        <p className="text-sm text-muted-foreground mt-1">Kiểm soát ai có thể xem thông tin của bạn</p>
      </div>

      <div className={`space-y-3 ${isLoading ? "pointer-events-none opacity-60" : ""}`}>
        {visibleOptions.map((option) => {
          const Icon = option.icon;
          return (
            <div
              key={option.id}
              className="bg-card rounded-2xl border border-border p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${option.iconBg}`}>
                    <Icon className={`h-5 w-5 ${option.iconColor}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                <Select
                  value={getValue(option.id)}
                  onValueChange={(v) => handleChange(option.id, v)}
                >
                  <SelectTrigger className="w-40 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {option.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
