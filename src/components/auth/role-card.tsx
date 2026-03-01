"use client";

import { cn } from "@/lib/utils";
import { SmallCheckIcon, GraduationCapIcon, UsersIcon, SettingsIcon } from "@/components/icons";

export type RoleType = "student" | "parent" | "teacher" | "admin";

interface RoleCardProps {
  role: RoleType;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const roleConfig: Record<RoleType, { label: string; description: string; icon: React.ReactNode }> = {
  student: {
    label: "Học sinh",
    description: "Tham gia lớp học và hoàn thành bài tập",
    icon: <GraduationCapIcon size={28} />,
  },
  parent: {
    label: "Phụ huynh",
    description: "Theo dõi quá trình học tập của con",
    icon: <UsersIcon size={28} />,
  },
  teacher: {
    label: "Giáo viên",
    description: "Quản lý lớp học và bài giảng",
    icon: <UsersIcon size={28} />,
  },
  admin: {
    label: "Quản lý",
    description: "Quản lý hệ thống và tổ chức",
    icon: <SettingsIcon size={28} />,
  },
};

export function RoleCard({ role, selected, onClick, className }: RoleCardProps) {
  const config = roleConfig[role];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${config.label} - ${config.description}`}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all",
        selected
          ? "border-primary-500 bg-primary-50 text-primary-700"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
        className
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
          selected ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
        )}
      >
        {config.icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{config.label}</p>
        <p className={cn("text-xs", selected ? "text-primary-600" : "text-gray-500")}>
          {config.description}
        </p>
      </div>
      <div className="ml-auto shrink-0">
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border-2",
            selected ? "border-primary-500 bg-primary-500 text-white" : "border-gray-300"
          )}
        >
          {selected && <SmallCheckIcon />}
        </div>
      </div>
    </button>
  );
}
