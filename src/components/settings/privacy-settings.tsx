"use client";

import { useState } from "react";
import { Eye, Users, Trophy } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PrivacyOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  options: { value: string; label: string }[];
  defaultValue: string;
}

const privacyOptions: PrivacyOption[] = [
  {
    id: "profile-visibility",
    label: "Hiển thị hồ sơ",
    description: "Ai có thể xem hồ sơ của bạn",
    icon: Eye,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    options: [
      { value: "public", label: "Công khai" },
      { value: "friends", label: "Chỉ bạn bè" },
      { value: "private", label: "Riêng tư" },
    ],
    defaultValue: "public",
  },
  {
    id: "activity-status",
    label: "Trạng thái hoạt động",
    description: "Cho người khác biết khi bạn đang học",
    icon: Users,
    iconBg: "bg-green-50",
    iconColor: "text-green-500",
    options: [
      { value: "everyone", label: "Mọi người" },
      { value: "friends", label: "Chỉ bạn bè" },
      { value: "none", label: "Không ai" },
    ],
    defaultValue: "everyone",
  },
  {
    id: "leaderboard-visibility",
    label: "Bảng xếp hạng",
    description: "Hiển thị tên bạn trên bảng xếp hạng công khai",
    icon: Trophy,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    options: [
      { value: "name", label: "Hiển thị tên" },
      { value: "username", label: "Hiển thị username" },
      { value: "anonymous", label: "Ẩn danh" },
    ],
    defaultValue: "name",
  },
];

export function PrivacySettings() {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(privacyOptions.map((o) => [o.id, o.defaultValue]))
  );

  const handleChange = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    // TODO: API call to save privacy setting
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Quyền riêng tư</h2>
        <p className="text-sm text-gray-500 mt-1">Kiểm soát ai có thể xem thông tin của bạn</p>
      </div>

      <div className="space-y-3">
        {privacyOptions.map((option) => {
          const Icon = option.icon;
          return (
            <div
              key={option.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${option.iconBg}`}>
                    <Icon className={`h-5 w-5 ${option.iconColor}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </div>
                <Select value={values[option.id]} onValueChange={(v) => handleChange(option.id, v)}>
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
