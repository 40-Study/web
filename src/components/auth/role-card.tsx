"use client";

import { cn } from "@/lib/utils";
import { SmallCheckIcon, GraduationCapIcon, UsersIcon, SettingsIcon } from "@/components/icons";

export type RoleType = "student" | "parent" | "teacher" | "applicant" | "admin";

/**
 * Map role_name backend → loại thẻ hiển thị. Kiểm "applicant" TRƯỚC "teacher":
 * "TEACHER_APPLICANT" cũng chứa chữ "teacher" và từng hiện sai là thẻ "Giáo viên — Quản lý
 * lớp học" dù ứng viên chưa có quyền giảng dạy (Phase 3: /auth/system-roles trả
 * TEACHER_APPLICANT thay cho TEACHER).
 */
export function roleNameToRoleType(roleName: string): RoleType {
  const name = roleName.toLowerCase();
  if (name.includes("applicant")) return "applicant";
  if (name.includes("student")) return "student";
  if (name.includes("teacher")) return "teacher";
  if (name.includes("parent")) return "parent";
  if (name.includes("admin") || name.includes("owner")) return "admin";
  return "student";
}

interface RoleCardProps {
  role: RoleType;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  /** Override label (e.g., for org roles: "Kế toán - Trường PTIT") */
  label?: string;
  /** Override description/subtitle */
  subtitle?: string;
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
  applicant: {
    label: "Đăng ký làm giảng viên",
    description: "Nộp hồ sơ để quản trị viên duyệt trở thành giảng viên",
    icon: <UsersIcon size={28} />,
  },
  admin: {
    label: "Quản lý",
    description: "Quản lý hệ thống và tổ chức",
    icon: <SettingsIcon size={28} />,
  },
};

export function RoleCard({ role, selected, onClick, className, label, subtitle }: RoleCardProps) {
  const config = roleConfig[role];
  const displayLabel = label || config.label;
  const displayDesc = subtitle || config.description;

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
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-muted-foreground hover:bg-muted",
        className
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
          selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        {config.icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{displayLabel}</p>
        {displayDesc && (
          <p className={cn("text-xs", selected ? "text-primary" : "text-muted-foreground")}>
            {displayDesc}
          </p>
        )}
      </div>
      <div className="ml-auto shrink-0">
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border-2",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
          )}
        >
          {selected && <SmallCheckIcon />}
        </div>
      </div>
    </button>
  );
}
